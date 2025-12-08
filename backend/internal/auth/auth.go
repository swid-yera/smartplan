package auth

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

var kcClient *KeycloakClient

func Init(realmURL string) {
	kcClient = NewKeycloakClient(realmURL)
}

func AuthMiddleware(audience string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tokenString := extractBearerToken(c)
		if tokenString == "" {
			return c.Status(401).JSON(fiber.Map{"error": "missing token"})
		}

		token, err := jwt.Parse(tokenString, kcClient.KeyFunc)
		if err != nil || !token.Valid {
			return c.Status(401).JSON(fiber.Map{"error": "invalid token"})
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return c.Status(401).JSON(fiber.Map{"error": "invalid claims"})
		}

		// Check issuer
		if iss, ok := claims["iss"].(string); !ok || iss != kcClient.realmURL {
			return c.Status(401).JSON(fiber.Map{"error": "invalid issuer"})
		}

		// Check audience
		aud, ok := claims["aud"].([]interface{})
		if !ok {
			if audStr, ok := claims["aud"].(string); ok && audStr == audience {
				// ok
			} else {
				return c.Status(401).JSON(fiber.Map{"error": "invalid audience"})
			}
		} else {
			found := false
			for _, a := range aud {
				if a == audience {
					found = true
					break
				}
			}
			if !found {
				return c.Status(401).JSON(fiber.Map{"error": "invalid audience"})
			}
		}

		// Set locals
		c.Locals("user_id", claims["sub"])
		if realmAccess, ok := claims["realm_access"].(map[string]interface{}); ok {
			if roles, ok := realmAccess["roles"].([]interface{}); ok {
				var roleStrings []string
				for _, r := range roles {
					if rs, ok := r.(string); ok {
						roleStrings = append(roleStrings, rs)
					}
				}
				c.Locals("roles", roleStrings)
			}
		}
		if groups, ok := claims["groups"].([]interface{}); ok {
			var groupStrings []string
			for _, g := range groups {
				if gs, ok := g.(string); ok {
					groupStrings = append(groupStrings, gs)
				}
			}
			c.Locals("groups", groupStrings)
		}
		return c.Next()
	}
}

func extractBearerToken(c *fiber.Ctx) string {
	auth := c.Get("Authorization")
	if len(auth) > 7 && strings.HasPrefix(auth, "Bearer ") {
		return auth[7:]
	}
	return ""
}

func RequireRole(role string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		roles, ok := c.Locals("roles").([]string)
		if !ok {
			return c.Status(403).SendString("Forbidden")
		}
		for _, r := range roles {
			if r == role {
				return c.Next()
			}
		}
		return c.Status(403).SendString("Forbidden")
	}
}
