package service

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/ed25519"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"strings"

	"golang.org/x/crypto/pbkdf2"
)

func signDocumentHashWithKriptoKey(password string, kripto *KriptoKeyPayload, documentHash string) (string, error) {
	if kripto == nil {
		return "", fmt.Errorf("kripto payload is required")
	}
	if strings.TrimSpace(kripto.KeyID) == "" {
		return "", fmt.Errorf("kripto key_id is required")
	}
	if strings.TrimSpace(kripto.UserID) == "" {
		return "", fmt.Errorf("kripto user_id is required")
	}
	if strings.ToUpper(strings.TrimSpace(kripto.Format)) != "KRIPTO_KEY" {
		return "", fmt.Errorf("unsupported kripto format: %s", kripto.Format)
	}
	if strings.ToUpper(strings.TrimSpace(kripto.Algorithm)) != "ED25519" {
		return "", fmt.Errorf("unsupported kripto algorithm: %s", kripto.Algorithm)
	}

	privateKey, err := decryptKriptoPrivateKey(password, kripto.EncryptedPrivateKey)
	if err != nil {
		return "", err
	}

	if len(privateKey) != ed25519.PrivateKeySize {
		return "", fmt.Errorf("invalid private key size: %d", len(privateKey))
	}

	expectedPublicKey, err := hex.DecodeString(strings.TrimSpace(kripto.PublicKey))
	if err != nil {
		return "", fmt.Errorf("decode public key: %w", err)
	}
	derivedPublicKey := privateKey.Public().(ed25519.PublicKey)
	if !bytes.Equal(expectedPublicKey, derivedPublicKey) {
		return "", fmt.Errorf("public key does not match decrypted private key")
	}

	hashBytes, err := hex.DecodeString(strings.TrimSpace(documentHash))
	if err != nil {
		return "", fmt.Errorf("decode document hash: %w", err)
	}

	signature := ed25519.Sign(privateKey, hashBytes)
	return hex.EncodeToString(signature), nil
}

func decryptKriptoPrivateKey(password string, encrypted KriptoEncryptedPrivateKey) (ed25519.PrivateKey, error) {
	if strings.ToUpper(strings.TrimSpace(encrypted.Cipher)) != "AES-256-GCM" {
		return nil, fmt.Errorf("unsupported cipher: %s", encrypted.Cipher)
	}
	if strings.ToUpper(strings.TrimSpace(encrypted.KDF)) != "PBKDF2" {
		return nil, fmt.Errorf("unsupported kdf: %s", encrypted.KDF)
	}
	if strings.ToUpper(strings.TrimSpace(encrypted.Hash)) != "SHA-256" {
		return nil, fmt.Errorf("unsupported hash: %s", encrypted.Hash)
	}
	if encrypted.Iterations < 1000 {
		return nil, fmt.Errorf("invalid iterations: %d", encrypted.Iterations)
	}

	salt, err := decodeKriptoBase64(encrypted.Salt)
	if err != nil {
		return nil, fmt.Errorf("decode salt: %w", err)
	}
	nonce, err := decodeKriptoBase64(encrypted.Nonce)
	if err != nil {
		return nil, fmt.Errorf("decode nonce: %w", err)
	}
	ciphertext, err := decodeKriptoBase64(encrypted.Value)
	if err != nil {
		return nil, fmt.Errorf("decode encrypted private key: %w", err)
	}

	derivedKey := pbkdf2.Key([]byte(password), salt, encrypted.Iterations, 32, sha256.New)
	block, err := aes.NewCipher(derivedKey)
	if err != nil {
		return nil, fmt.Errorf("create aes cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("create gcm: %w", err)
	}

	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, fmt.Errorf("decrypt private key: %w", err)
	}

	switch len(plaintext) {
	case ed25519.SeedSize:
		privateKey := ed25519.NewKeyFromSeed(plaintext)
		return privateKey, nil
	case ed25519.PrivateKeySize:
		return ed25519.PrivateKey(plaintext), nil
	default:
		return nil, fmt.Errorf("unexpected private key length: %d", len(plaintext))
	}
}

func decodeKriptoBase64(value string) ([]byte, error) {
	normalized := strings.TrimSpace(value)
	normalized = strings.NewReplacer("-", "+", "_", "/").Replace(normalized)
	if len(normalized)%4 != 0 {
		normalized += strings.Repeat("=", 4-(len(normalized)%4))
	}

	return base64.StdEncoding.DecodeString(normalized)
}
