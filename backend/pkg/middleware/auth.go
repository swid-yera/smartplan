package middleware

import (
	"context"
	"crypto/rsa"
	"eduplan/backend/config"
	"eduplan/backend/pkg/service"
	"eduplan/backend/pkg/service/keycloak"
	"encoding/base64"
	"encoding/binary"
	"math/big"
	"net/http"
	"strings"
	"time"

	"github.com/Nerzal/gocloak/v13"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
)

type AuthMiddleware struct {
	gocloak *gocloak.GoCloak
	realm   string
	keyFunc jwt.Keyfunc
	issuer  string
	redis   *redis.Client
	config  *config.KeycloakConfig
	log     *logrus.Logger
}

func NewAuthMiddleware(keycloakURL, realm string, redisClient *redis.Client, config *config.KeycloakConfig, log *logrus.Logger) (*AuthMiddleware, error) {
	client := gocloak.NewClient(keycloakURL)
	ctx := context.Background()

	issuer := keycloakURL + "/realms/" + realm

	// Get certificates for JWT validation
	certs, err := client.GetCerts(ctx, realm)
	if err != nil {
		log.Error("failed to get certs: %w", err)
		return nil, err
	}

	if certs == nil || len(*certs.Keys) == 0 {
		log.Error("no certs found")
		return nil, err
	}

	// Create a map of kid to public key
	keyMap := make(map[string]*rsa.PublicKey)
	for _, key := range *certs.Keys {
		if key.Kid == nil || key.N == nil || key.E == nil {
			continue
		}

		nBytes, err := base64.RawURLEncoding.DecodeString(*key.N)
		if err != nil {
			log.Error("failed to decode modulus for kid", *key.Kid, err)
			return nil, err
		}
		eBytes, err := base64.RawURLEncoding.DecodeString(*key.E)
		if err != nil {
			log.Error("failed to decode exponent for kid", *key.Kid, err)
			return nil, err
		}
		e := int(binary.BigEndian.Uint32(append(make([]byte, 4-len(eBytes)), eBytes...)))

		publicKey := &rsa.PublicKey{
			N: new(big.Int).SetBytes(nBytes),
			E: e,
		}
		keyMap[*key.Kid] = publicKey
	}

	if len(keyMap) == 0 {
		log.Error("no valid keys found")
		return nil, err
	}

	keyFunc := func(token *jwt.Token) (interface{}, error) {
		kid, ok := token.Header["kid"].(string)
		if !ok {
			log.Error("kid header missing in token")
			return nil, err
		}
		key, exists := keyMap[kid]
		if !exists {
			log.Error("unknown kid", kid)
			return nil, err
		}
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			log.Error("unexpected signing method", token.Header["alg"])
			return nil, err
		}
		return key, nil
	}

	return &AuthMiddleware{
		gocloak: client,
		realm:   realm,
		keyFunc: keyFunc,
		issuer:  issuer,
		redis:   redisClient,
		config:  config,
		log:     log,
	}, nil
}

func (a *AuthMiddleware) GetKeyFunc() jwt.Keyfunc {
	return a.keyFunc
}

const ContextUserKey = "user"

func (a *AuthMiddleware) ValidateSession() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get session ID from cookie
		sid, err := c.Cookie("sid")
		if err != nil {
			a.log.WithField("Cookie read error:", err)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "Not authenticated",
				"details": "Cookie read error",
			})
			return
		}
		if sid == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "Not authenticated",
				"details": "Empty session ID",
			})
			return
		}

		a.log.WithField("Validating session for SID:", sid)

		ctx := context.Background()
		sessionKey := "session:" + sid

		// Get session data from Redis
		sessionData, err := a.redis.HGetAll(ctx, sessionKey).Result()
		if err != nil {
			a.log.WithError(err).WithField("Redis error for session", sessionKey)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "Session not found",
				"details": "Redis error",
			})
			return
		}
		if len(sessionData) == 0 {
			a.log.WithField("No session data found for key:", sessionKey)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "Session not found",
				"details": "Empty session data",
			})
			return
		}

		a.log.WithField("Session data keys:", getKeys(sessionData))

		// Check if access token exists
		accessToken, ok := sessionData["access_token"]
		if !ok || accessToken == "" {
			a.log.WithField("No access token in session for key:", sessionKey)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "Invalid session",
				"details": "No access token",
			})
			return
		}

		// Validate access token with proper claims verification using JWKS
		token, err := jwt.Parse(accessToken, a.keyFunc)

		if err != nil {
			a.log.WithField("Access token parsing error:", err)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "Invalid access token",
				"details": err.Error(),
			})
			return
		}

		if !token.Valid {
			a.log.Error("Access token validation failed")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Access token validation failed",
			})
			return
		}

		// Validate claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid access token claims",
			})
			return
		}

		// Validate issuer
		if iss, ok := claims["iss"].(string); !ok || iss != a.issuer {
			a.log.WithField("Invalid issuer: expected", a.issuer).WithField(", got", claims["iss"])
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid token issuer",
			})
			return
		}

		// Validate authorized party (azp)
		azp, ok := claims["azp"].(string)
		if !ok || azp != a.config.KeycloakClientID {
			a.log.WithField("Invalid azp: expected", a.config.KeycloakClientID).WithField(", got", claims["azp"])
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid authorized party (azp)",
			})
			return
		}

		// Check expiration
		if exp, ok := claims["exp"].(float64); ok {
			if time.Now().Unix() > int64(exp) {
				a.log.Error("Access token expired")
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
					"error": "Access token expired",
				})
				return
			}
		}

		// Extract user info
		sub, ok := claims["sub"].(string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid subject in access token",
			})
			return
		}

		a.log.WithField("Access token validated successfully for user:", sub)

		// Set user context
		c.Set("keycloak_id", sub)
		c.Set("claims", claims)
		c.Next()
	}
}

// Helper function to get keys from map for logging
func getKeys(m map[string]string) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

func (a *AuthMiddleware) logout(c *gin.Context, sid string) {
	ctx := context.Background()
	a.redis.Del(ctx, "session:"+sid)

	// Clear the session cookie with the same settings as when it was set
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "sid",
		Value:    "",
		Path:     "/",
		Domain:   "", // Empty domain for localhost
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   false, // false for localhost (HTTP)
		SameSite: http.SameSiteLaxMode,
	})

	c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Session expired"})
}

func SessionAuth(userService service.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		sid, err := c.Cookie("sid")
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "no session",
			})
			return
		}

		sessionID, err := uuid.Parse(sid)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
				"error": "invalid session",
			})
			return
		}

		user, err := userService.GetUserBySessionID(c.Request.Context(), sessionID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "session expired or invalid",
			})
			return
		}

		// кладём пользователя в context
		c.Set(ContextUserKey, user)
		c.Next()
	}
}

func AuthRequired(kc *keycloak.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		h := c.GetHeader("Authorization")
		if h == "" || !strings.HasPrefix(strings.ToLower(h), "bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing bearer token"})
			return
		}
		token := strings.TrimSpace(h[len("Bearer "):])

		res, err := kc.IntrospectToken(c.Request.Context(), token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token introspect failed"})
			return
		}
		if res == nil || res.Active == nil || !*res.Active {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token inactive"})
			return
		}

		// при желании можно прокинуть user info в контекст
		c.Next()
	}
}
