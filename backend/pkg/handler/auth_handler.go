package handler

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"net/url"
	"strings"
	"time"

	"eduplan/backend/config"
	"eduplan/backend/pkg/service"

	"github.com/Nerzal/gocloak/v13"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
)

const (
	sessionCookieName = "sid"
	stateCookieName   = "kc_state"
)

type AuthHandler struct {
	gocloak *gocloak.GoCloak
	redis   *redis.Client
	cfg     *config.KeycloakConfig
	auth    service.AuthService
	keyFunc jwt.Keyfunc
	log     *logrus.Logger
}

func NewAuthHandler(
	gocloak *gocloak.GoCloak,
	redis *redis.Client,
	cfg *config.KeycloakConfig,
	auth service.AuthService,
	keyFunc jwt.Keyfunc,
	log *logrus.Logger,
) *AuthHandler {
	return &AuthHandler{
		gocloak: gocloak,
		redis:   redis,
		cfg:     cfg,
		auth:    auth,
		keyFunc: keyFunc,
		log:     log,
	}
}

func (h *AuthHandler) isHTTPS() bool {
	if h == nil || h.cfg == nil {
		return false
	}
	return strings.HasPrefix(strings.ToLower(h.cfg.BaseURL), "https://")
}

func (h *AuthHandler) backendCallbackURL() string {
	return strings.TrimRight(h.cfg.BaseURL, "/") + "/callback"
}

/* ---------- LOGIN ---------- */

func (h *AuthHandler) Login(c *gin.Context) {
	if h == nil || h.cfg == nil {
		h.log.Error("Auth handler not configured during login attempt")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "auth handler not configured"})
		return
	}

	// --- ВОТ ЭТО ДОБАВИТЬ (logout before login) ---
	ctx := c.Request.Context()
	if sid, err := c.Cookie(sessionCookieName); err == nil && sid != "" {
		h.log.WithField("sid", sid).Info("Existing session found during login. Logging out first.")
		_ = h.auth.Logout(ctx, sid)

		http.SetCookie(c.Writer, &http.Cookie{
			Name:     sessionCookieName,
			Value:    "",
			Path:     "/",
			HttpOnly: true,
			Secure:   h.isHTTPS(),
			SameSite: http.SameSiteLaxMode,
			MaxAge:   -1,
		})
	}
	// --- конец добавленного блока ---

	redirectURI := h.backendCallbackURL()
	stateBytes := make([]byte, 16)
	if _, err := rand.Read(stateBytes); err != nil {
		h.log.WithError(err).Error("Failed to generate random state for login")
		c.Redirect(http.StatusFound, strings.TrimRight(h.cfg.FrontendURL, "/")+"/login?error=server_error")
		return
	}
	state := base64.RawURLEncoding.EncodeToString(stateBytes)

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     stateCookieName,
		Value:    state, // Используем сгенерированный state
		Path:     "/",
		HttpOnly: true,
		Secure:   h.isHTTPS(),
		SameSite: http.SameSiteLaxMode,
		MaxAge:   300,
		Expires:  time.Now().Add(5 * time.Minute),
	})

	loginURL := h.cfg.KeycloakURL +
		"/realms/" + h.cfg.KeycloakRealm +
		"/protocol/openid-connect/auth" +
		"?client_id=" + url.QueryEscape(h.cfg.KeycloakClientID) +
		"&redirect_uri=" + url.QueryEscape(redirectURI) +
		"&response_type=code" +
		"&scope=openid" +
		"&state=" + url.QueryEscape(state)

	// 🔥 Опционально, но часто нужно, чтобы Keycloak не делал silent login тем же юзером
	// loginURL += "&prompt=login"

	c.Redirect(http.StatusFound, loginURL)
}

/* ---------- CALLBACK ---------- */
func (h *AuthHandler) Callback(c *gin.Context) {
	if h == nil || h.cfg == nil {
		h.log.Error("Auth handler not configured during callback")
		c.Redirect(http.StatusFound, strings.TrimRight(h.cfg.FrontendURL, "/")+"/login?error=server_not_configured")
		return
	}

	code := c.Query("code")
	state := c.Query("state")

	if code == "" {
		h.log.Warn("Callback request is missing 'code' query parameter")
		c.Redirect(http.StatusFound, strings.TrimRight(h.cfg.FrontendURL, "/")+"/login?error=missing_code")
		return
	}

	cookieState, err := c.Cookie(stateCookieName)
	if err != nil || cookieState != state {
		h.log.WithError(err).Warn("Callback state mismatch or cookie error")
		c.Redirect(http.StatusFound, strings.TrimRight(h.cfg.FrontendURL, "/")+"/login?error=invalid_state")
		return
	}

	// state cookie одноразовый
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     stateCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   h.isHTTPS(),
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})

	ctx := c.Request.Context()
	redirectURI := h.backendCallbackURL()

	token, err := h.gocloak.GetToken(ctx, h.cfg.KeycloakRealm, gocloak.TokenOptions{
		ClientID:     &h.cfg.KeycloakClientID,
		ClientSecret: &h.cfg.KeycloakSecret,
		Code:         &code,
		GrantType:    gocloak.StringP("authorization_code"),
		RedirectURI:  gocloak.StringP(redirectURI),
	})
	if err != nil {
		// важно: не оставляем пользователя на /callback
		// и логируем причину
		h.log.WithError(err).Error("Failed to exchange authorization code for token")
		c.Redirect(http.StatusFound, strings.TrimRight(h.cfg.FrontendURL, "/")+"/login?error=token_exchange_failed")
		return
	}

	parsed, err := jwt.Parse(token.AccessToken, h.keyFunc)
	if err != nil && strings.Contains(strings.ToLower(err.Error()), "token used before issued") {
		// Fallback for small clock skew between Keycloak and backend host:
		// keep signature verification, skip time-claims validation at callback stage.
		parser := &jwt.Parser{SkipClaimsValidation: true}
		parsed, err = parser.Parse(token.AccessToken, h.keyFunc)
	}

	if err != nil || !parsed.Valid {
		h.log.WithFields(logrus.Fields{
			"error":       err,
			"token_valid": parsed != nil && parsed.Valid,
		}).Error("Callback token validation failed")
		c.Redirect(http.StatusFound, strings.TrimRight(h.cfg.FrontendURL, "/")+"/login?error=invalid_token")
		return
	}

	claims, ok := parsed.Claims.(jwt.MapClaims)
	if !ok {
		h.log.WithField("claims_type", claims).Error("Invalid claims type in JWT")
		c.Redirect(http.StatusFound, strings.TrimRight(h.cfg.FrontendURL, "/")+"/login?error=invalid_claims")
		return
	}

	subStr, ok := claims["sub"].(string)
	if !ok {
		h.log.WithFields(logrus.Fields{
			"claims": claims,
		}).Error("'sub' claim not found or not a string in JWT")
		c.Redirect(http.StatusFound, strings.TrimRight(h.cfg.FrontendURL, "/")+"/login?error=sub_not_found")
		return
	}

	keycloakID, err := uuid.Parse(subStr)
	if err != nil {
		h.log.WithError(err).WithField("sub", subStr).Error("Failed to parse 'sub' claim as UUID")
		c.Redirect(http.StatusFound, strings.TrimRight(h.cfg.FrontendURL, "/")+"/login?error=invalid_sub")
		return
	}

	sessionID, err := h.auth.HandleCallback(ctx, keycloakID, token.AccessToken, token.IDToken, claims)
	if err != nil {
		h.log.WithError(err).WithField("keycloak_id", keycloakID).Error("Auth service HandleCallback failed")
		c.Redirect(http.StatusFound, strings.TrimRight(h.cfg.FrontendURL, "/")+"/login?error=auth_failed")
		return
	}

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     sessionCookieName,
		Value:    sessionID.String(),
		Path:     "/",
		HttpOnly: true,
		Secure:   h.isHTTPS(),
		SameSite: http.SameSiteLaxMode,
		MaxAge:   86400,
		Expires:  time.Now().Add(24 * time.Hour),
	})

	h.log.WithFields(logrus.Fields{
		"keycloak_id": keycloakID,
		"session_id":  sessionID,
	}).Info("User successfully authenticated and session created")
	c.Redirect(http.StatusFound, h.cfg.FrontendURL)
}

/* ---------- LOGOUT ---------- */

func (h *AuthHandler) Logout(c *gin.Context) {
	if h == nil || h.cfg == nil {
		h.log.Error("Auth handler not configured during logout attempt")
		c.Redirect(http.StatusFound, "/")
		return
	}

	ctx := c.Request.Context()

	var idToken string

	// 1) если есть sid — читаем session
	if sid, err := c.Cookie(sessionCookieName); err == nil && sid != "" {
		sessionKey := "session:" + sid

		sessionData, err := h.redis.HGetAll(ctx, sessionKey).Result()
		if err != nil {
			h.log.WithError(err).Warn("Failed to load session for logout")
		} else {
			idToken = sessionData["id_token"]
		}

		_ = h.auth.Logout(ctx, sid) // удаляем локальную сессию
	}

	// 2) чистим cookie
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   h.isHTTPS(),
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})

	// 3) если есть id_token — logout через Keycloak
	if idToken != "" {
		postLogoutRedirect := strings.TrimRight(h.cfg.FrontendURL, "")

		kcLogoutURL := h.cfg.KeycloakURL +
			"/realms/" + h.cfg.KeycloakRealm +
			"/protocol/openid-connect/logout" +
			"?id_token_hint=" + url.QueryEscape(idToken) +
			"&post_logout_redirect_uri=" + url.QueryEscape(postLogoutRedirect)

		h.log.Info("Redirecting user to Keycloak logout")
		c.Redirect(http.StatusFound, kcLogoutURL)
		return
	}

	// 4) fallback — если id_token нет
	h.log.Warn("id_token not found in session, redirecting to frontend login")
	c.Redirect(http.StatusFound, strings.TrimRight(h.cfg.FrontendURL, "/")+"/login")
}
