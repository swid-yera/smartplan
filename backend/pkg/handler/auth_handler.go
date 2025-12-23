package handler

import (
	"crypto/rand"
	"encoding/hex"
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
}

func NewAuthHandler(
	gocloak *gocloak.GoCloak,
	redis *redis.Client,
	cfg *config.KeycloakConfig,
	auth service.AuthService,
	keyFunc jwt.Keyfunc,
) *AuthHandler {
	return &AuthHandler{
		gocloak: gocloak,
		redis:   redis,
		cfg:     cfg,
		auth:    auth,
		keyFunc: keyFunc,
	}
}

func randomHex(n int) string {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "auth handler not configured"})
		return
	}

	redirectURI := h.backendCallbackURL()
	state := randomHex(16)

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     stateCookieName,
		Value:    state,
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

	c.Redirect(http.StatusFound, loginURL)
}

/* ---------- CALLBACK ---------- */

func (h *AuthHandler) Callback(c *gin.Context) {
	if h == nil || h.cfg == nil {
		c.Redirect(http.StatusFound, strings.TrimRight(h.cfg.FrontendURL, "/")+"/login?error=server_not_configured")
		return
	}

	code := c.Query("code")
	state := c.Query("state")

	if code == "" {
		c.Redirect(http.StatusFound, strings.TrimRight(h.cfg.FrontendURL, "/")+"/login?error=missing_code")
		return
	}

	cookieState, err := c.Cookie(stateCookieName)
	if err != nil || cookieState != state {
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
		// и логируем причину в консоль
		c.Error(err)
		c.Redirect(http.StatusFound, strings.TrimRight(h.cfg.FrontendURL, "/")+"/login?error=token_exchange_failed")
		return
	}

	parsed, err := jwt.Parse(token.AccessToken, h.keyFunc)
	if err != nil || !parsed.Valid {
		c.Redirect(http.StatusFound, strings.TrimRight(h.cfg.FrontendURL, "/")+"/login?error=invalid_token")
		return
	}

	claims, ok := parsed.Claims.(jwt.MapClaims)
	if !ok {
		c.Redirect(http.StatusFound, strings.TrimRight(h.cfg.FrontendURL, "/")+"/login?error=invalid_claims")
		return
	}

	subStr, ok := claims["sub"].(string)
	if !ok {
		c.Redirect(http.StatusFound, strings.TrimRight(h.cfg.FrontendURL, "/")+"/login?error=sub_not_found")
		return
	}

	keycloakID, err := uuid.Parse(subStr)
	if err != nil {
		c.Redirect(http.StatusFound, strings.TrimRight(h.cfg.FrontendURL, "/")+"/login?error=invalid_sub")
		return
	}

	sessionID, err := h.auth.HandleCallback(ctx, keycloakID, token.AccessToken, claims)
	if err != nil {
		c.Error(err)
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

	c.Redirect(http.StatusFound, h.cfg.FrontendURL)
}

/* ---------- LOGOUT ---------- */

func (h *AuthHandler) Logout(c *gin.Context) {
	if h == nil || h.cfg == nil {
		c.Redirect(http.StatusFound, "/")
		return
	}

	sid, err := c.Cookie(sessionCookieName)
	if err == nil && sid != "" {
		_ = h.redis.Del(c.Request.Context(), "session:"+sid).Err()
	}

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   h.isHTTPS(),
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})

	c.Redirect(http.StatusFound, strings.TrimRight(h.cfg.FrontendURL, "/")+"/login")
}
