package auth

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type KeycloakClient struct {
	realmURL string
	jwksURL  string
	keys     map[string]interface{}
	mu       sync.RWMutex
	lastFetch time.Time
}

func NewKeycloakClient(realmURL string) *KeycloakClient {
	return &KeycloakClient{
		realmURL: realmURL,
		jwksURL:  realmURL + "/protocol/openid-connect/certs",
		keys:     make(map[string]interface{}),
	}
}

func (kc *KeycloakClient) GetKey(kid string) (interface{}, error) {
	kc.mu.RLock()
	if key, ok := kc.keys[kid]; ok && time.Since(kc.lastFetch) < 15*time.Minute {
		kc.mu.RUnlock()
		return key, nil
	}
	kc.mu.RUnlock()

	// Fetch new keys
	kc.mu.Lock()
	defer kc.mu.Unlock()

	resp, err := http.Get(kc.jwksURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var jwks struct {
		Keys []map[string]interface{} `json:"keys"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&jwks); err != nil {
		return nil, err
	}

	kc.keys = make(map[string]interface{})
	for _, key := range jwks.Keys {
		if k, ok := key["kid"].(string); ok {
			kc.keys[k] = key
		}
	}
	kc.lastFetch = time.Now()

	if key, ok := kc.keys[kid]; ok {
		return key, nil
	}
	return nil, fmt.Errorf("key not found")
}

func (kc *KeycloakClient) KeyFunc(token *jwt.Token) (interface{}, error) {
	kid, ok := token.Header["kid"].(string)
	if !ok {
		return nil, fmt.Errorf("kid header not found")
	}
	key, err := kc.GetKey(kid)
	if err != nil {
		return nil, err
	}
	return key, nil
}
