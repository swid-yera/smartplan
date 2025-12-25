package middleware

import (
	"context"
	"crypto/rsa"
	"eduplan/backend/config"
	"eduplan/backend/pkg/service"
	"encoding/base64"
	"encoding/binary"
	"fmt"
	"math/big"
	"net/http"
	"time"

	"github.com/Nerzal/gocloak/v13"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type AuthMiddleware struct {
	gocloak *gocloak.GoCloak
	realm   string
	keyFunc jwt.Keyfunc
	issuer  string
	redis   *redis.Client
	config  *config.KeycloakConfig
}

func NewAuthMiddleware(keycloakURL, realm string, redisClient *redis.Client, config *config.KeycloakConfig) (*AuthMiddleware, error) {
	client := gocloak.NewClient(keycloakURL)
	ctx := context.Background()

	issuer := keycloakURL + "/realms/" + realm

	// Get certificates for JWT validation
	certs, err := client.GetCerts(ctx, realm)
	if err != nil {
		return nil, fmt.Errorf("failed to get certs: %w", err)
	}

	if certs == nil || len(*certs.Keys) == 0 {
		return nil, fmt.Errorf("no certs found")
	}

	// Create a map of kid to public key
	keyMap := make(map[string]*rsa.PublicKey)
	for _, key := range *certs.Keys {
		if key.Kid == nil || key.N == nil || key.E == nil {
			continue
		}

		nBytes, err := base64.RawURLEncoding.DecodeString(*key.N)
		if err != nil {
			return nil, fmt.Errorf("failed to decode modulus for kid %s: %w", *key.Kid, err)
		}
		eBytes, err := base64.RawURLEncoding.DecodeString(*key.E)
		if err != nil {
			return nil, fmt.Errorf("failed to decode exponent for kid %s: %w", *key.Kid, err)
		}
		e := int(binary.BigEndian.Uint32(append(make([]byte, 4-len(eBytes)), eBytes...)))

		publicKey := &rsa.PublicKey{
			N: new(big.Int).SetBytes(nBytes),
			E: e,
		}
		keyMap[*key.Kid] = publicKey
	}

	if len(keyMap) == 0 {
		return nil, fmt.Errorf("no valid keys found")
	}

	keyFunc := func(token *jwt.Token) (interface{}, error) {
		kid, ok := token.Header["kid"].(string)
		if !ok {
			return nil, fmt.Errorf("kid header missing in token")
		}
		key, exists := keyMap[kid]
		if !exists {
			return nil, fmt.Errorf("unknown kid: %s", kid)
		}
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
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
	}, nil
}

func (a *AuthMiddleware) GetKeyFunc() jwt.Keyfunc {
	return a.keyFunc
}

func (a *AuthMiddleware) ValidateSession() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get session ID from cookie
		sid, err := c.Cookie("sid")
		if err != nil {
			fmt.Printf("Cookie read error: %v\n", err)
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

		fmt.Printf("Validating session for SID: %s\n", sid)

		ctx := context.Background()
		sessionKey := "session:" + sid

		// Get session data from Redis
		sessionData, err := a.redis.HGetAll(ctx, sessionKey).Result()
		if err != nil {
			fmt.Printf("Redis error for session %s: %v\n", sessionKey, err)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "Session not found",
				"details": "Redis error",
			})
			return
		}
		if len(sessionData) == 0 {
			fmt.Printf("No session data found for key: %s\n", sessionKey)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "Session not found",
				"details": "Empty session data",
			})
			return
		}

		fmt.Printf("Session data keys: %v\n", getKeys(sessionData))

		// Check if access token exists
		accessToken, ok := sessionData["access_token"]
		if !ok || accessToken == "" {
			fmt.Printf("No access token in session for key: %s\n", sessionKey)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "Invalid session",
				"details": "No access token",
			})
			return
		}

		// Validate access token with proper claims verification using JWKS
		token, err := jwt.Parse(accessToken, a.keyFunc)

		if err != nil {
			fmt.Printf("Access token parsing error: %v\n", err)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "Invalid access token",
				"details": err.Error(),
			})
			return
		}

		if !token.Valid {
			fmt.Printf("Access token validation failed\n")
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
			fmt.Printf("Invalid issuer: expected %s, got %v\n", a.issuer, claims["iss"])
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid token issuer",
			})
			return
		}

		// Validate authorized party (azp)
		azp, ok := claims["azp"].(string)
		if !ok || azp != a.config.KeycloakClientID {
			fmt.Printf("Invalid azp: expected %s, got %v\n", a.config.KeycloakClientID, claims["azp"])
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid authorized party (azp)",
			})
			return
		}

		// Check expiration
		if exp, ok := claims["exp"].(float64); ok {
			if time.Now().Unix() > int64(exp) {
				fmt.Printf("Access token expired\n")
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

		fmt.Printf("Access token validated successfully for user: %s\n", sub)

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

const ContextUserKey = "user"

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

		user, err := userService.GetUserBySessionID(
			c.Request.Context(),
			sessionID,
		)
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
