package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"eduplan/backend/pkg/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type kriptoApprovalDocumentHashPayload struct {
	RupID   uuid.UUID        `json:"rupId"`
	Payload CreateRupRequest `json:"payload"`
}

func (s *rupService) GetRupSignatureArtifact(ctx context.Context, id uuid.UUID) (*RupSignatureArtifactResponse, error) {
	artifact, err := s.repo.GetLatestRupSignatureArtifact(ctx, id)
	if err != nil {
		return nil, err
	}

	return toRupSignatureArtifactResponse(artifact), nil
}

func (s *rupService) buildKriptoDocumentHash(rup *RupResponse) (string, error) {
	if rup == nil {
		return "", fmt.Errorf("rup is nil")
	}

	payload := kriptoApprovalDocumentHashPayload{
		RupID:   rup.ID,
		Payload: mapRupResponseToCreateRequest(rup),
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("marshal approval payload: %w", err)
	}

	sum := sha256.Sum256(body)
	return hex.EncodeToString(sum[:]), nil
}

func (s *rupService) buildSignerName(user *User) string {
	if user == nil {
		return ""
	}

	parts := make([]string, 0, 2)
	if trimmed := strings.TrimSpace(user.FirstName); trimmed != "" {
		parts = append(parts, trimmed)
	}
	if trimmed := strings.TrimSpace(user.LastName); trimmed != "" {
		parts = append(parts, trimmed)
	}
	if len(parts) > 0 {
		return strings.Join(parts, " ")
	}
	if trimmed := strings.TrimSpace(user.Username); trimmed != "" {
		return trimmed
	}

	return user.KeycloakID.String()
}

func (s *rupService) registerApprovalArtifact(
	ctx context.Context,
	req UpdateRupStatusRequest,
	rup *RupResponse,
	signerName string,
	signerRole string,
) (*RupSignatureArtifactResponse, error) {
	if s.crypto == nil {
		return nil, &HTTPStatusError{
			StatusCode: 502,
			Message:    "kripto client is not configured",
		}
	}
	if req.Kripto != nil {
		if req.Kripto.KeyID != "" && !strings.EqualFold(strings.TrimSpace(req.Kripto.KeyID), strings.TrimSpace(req.KeyID)) {
			return nil, &HTTPStatusError{
				StatusCode: http.StatusBadRequest,
				Message:    "kripto key_id does not match request key_id",
			}
		}
		if req.Kripto.UserID != "" && !strings.EqualFold(strings.TrimSpace(req.Kripto.UserID), strings.TrimSpace(req.UserID)) {
			return nil, &HTTPStatusError{
				StatusCode: http.StatusBadRequest,
				Message:    "kripto user_id does not match request user_id",
			}
		}
	}

	documentHash, err := s.buildKriptoDocumentHash(rup)
	if err != nil {
		return nil, err
	}

	signature := strings.ToLower(strings.TrimSpace(req.Signature))
	if signature == "" {
		if req.Kripto == nil {
			return nil, &HTTPStatusError{
				StatusCode: http.StatusBadRequest,
				Message:    "signature is required for approved status",
			}
		}

		signature, err = signDocumentHashWithKriptoKey(req.Password, req.Kripto, documentHash)
		if err != nil {
			return nil, &HTTPStatusError{
				StatusCode: http.StatusBadRequest,
				Message:    err.Error(),
			}
		}
	}

	// If the exact artifact already exists locally, reuse it instead of calling Kripto twice.
	if existing, err := s.repo.GetRupSignatureArtifactByUnique(ctx, req.ID, documentHash, req.KeyIDAsUUID(), req.UserIDAsUUID(), signature); err == nil {
		return toRupSignatureArtifactResponse(existing), nil
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	documentVersion := uuid.New()
	registerResp, err := s.crypto.RegisterSignature(ctx, RegisterSignatureRequest{
		DocumentID:      req.ID.String(),
		DocumentVersion: documentVersion.String(),
		DocumentHash:    documentHash,
		KeyID:           req.KeyID,
		UserID:          req.UserID,
		Signature:       signature,
		SignerName:      signerName,
		SignerRole:      signerRole,
	}, req.CorrelationID)
	if err != nil {
		var httpErr *CryptoHTTPError
		if errors.As(err, &httpErr) {
			switch httpErr.StatusCode {
			case http.StatusConflict:
				if existing, lookupErr := s.repo.GetRupSignatureArtifactByUnique(ctx, req.ID, documentHash, req.KeyIDAsUUID(), req.UserIDAsUUID(), signature); lookupErr == nil {
					return toRupSignatureArtifactResponse(existing), nil
				}
				return nil, &HTTPStatusError{
					StatusCode: http.StatusConflict,
					Message:    strings.TrimSpace(httpErr.Body),
				}
			case http.StatusUnprocessableEntity:
				return nil, &HTTPStatusError{
					StatusCode: http.StatusUnprocessableEntity,
					Message:    "invalid signature",
				}
			default:
				if httpErr.StatusCode >= 500 {
					return nil, &HTTPStatusError{
						StatusCode: http.StatusBadGateway,
						Message:    "kripto temporary error",
					}
				}
				return nil, &HTTPStatusError{
					StatusCode: http.StatusBadRequest,
					Message:    strings.TrimSpace(httpErr.Body),
				}
			}
		}

		return nil, err
	}

	artifact := &repository.RupSignatureArtifact{
		RupID:           req.ID,
		DocumentID:      req.ID.String(),
		DocumentVersion: documentVersion,
		DocumentHash:    documentHash,
		KeyID:           req.KeyIDAsUUID(),
		UserID:          req.UserIDAsUUID(),
		Signature:       signature,
		SignerName:      signerName,
		SignerRole:      signerRole,
		SignatureID:     strings.TrimSpace(registerResp.SignatureID),
		VerificationURL: strings.TrimSpace(registerResp.VerificationURL),
		QRSvg:           registerResp.QRSvg,
	}

	return toRupSignatureArtifactResponse(artifact), nil
}

func (req UpdateRupStatusRequest) KeyIDAsUUID() uuid.UUID {
	keyID, err := uuid.Parse(strings.TrimSpace(req.KeyID))
	if err != nil {
		return uuid.Nil
	}

	return keyID
}

func (req UpdateRupStatusRequest) UserIDAsUUID() uuid.UUID {
	userID, err := uuid.Parse(strings.TrimSpace(req.UserID))
	if err != nil {
		return uuid.Nil
	}

	return userID
}

func toRupSignatureArtifactResponse(artifact *repository.RupSignatureArtifact) *RupSignatureArtifactResponse {
	if artifact == nil {
		return nil
	}

	return &RupSignatureArtifactResponse{
		ID:              artifact.ID,
		RupID:           artifact.RupID,
		DocumentID:      artifact.DocumentID,
		DocumentVersion: artifact.DocumentVersion,
		DocumentHash:    artifact.DocumentHash,
		KeyID:           artifact.KeyID,
		UserID:          artifact.UserID,
		Signature:       artifact.Signature,
		SignerName:      artifact.SignerName,
		SignerRole:      artifact.SignerRole,
		SignatureID:     artifact.SignatureID,
		VerificationURL: artifact.VerificationURL,
		QRSvg:           artifact.QRSvg,
		CreatedAt:       artifact.CreatedAt,
		UpdatedAt:       artifact.UpdatedAt,
	}
}

func toRupSignatureArtifactRepository(artifact *RupSignatureArtifactResponse) *repository.RupSignatureArtifact {
	if artifact == nil {
		return nil
	}

	return &repository.RupSignatureArtifact{
		ID:              artifact.ID,
		RupID:           artifact.RupID,
		DocumentID:      artifact.DocumentID,
		DocumentVersion: artifact.DocumentVersion,
		DocumentHash:    artifact.DocumentHash,
		KeyID:           artifact.KeyID,
		UserID:          artifact.UserID,
		Signature:       artifact.Signature,
		SignerName:      artifact.SignerName,
		SignerRole:      artifact.SignerRole,
		SignatureID:     artifact.SignatureID,
		VerificationURL: artifact.VerificationURL,
		QRSvg:           artifact.QRSvg,
	}
}
