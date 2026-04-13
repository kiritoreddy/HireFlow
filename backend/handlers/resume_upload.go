package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

const (
	resumeMaxBytes    int64 = 5 << 20 // 5 MiB
	resumeFormField         = "resume"
	multipartMaxMemory      = 32 << 20
)

var allowedResumeExts = map[string]bool{
	".pdf": true, ".doc": true, ".docx": true,
}

// resumeUploadRoot is the base directory for stored files (defaults to current working directory).
func resumeUploadRoot() string {
	if d := strings.TrimSpace(os.Getenv("HF_UPLOAD_ROOT")); d != "" {
		return d
	}
	return "."
}

func parseApplyMultipart(r *http.Request) (jobID uint, name, resumeRelPath string, err error) {
	if err := r.ParseMultipartForm(multipartMaxMemory); err != nil {
		return 0, "", "", err
	}
	jid, err := strconv.ParseUint(strings.TrimSpace(r.FormValue("job_id")), 10, 32)
	if err != nil || jid == 0 {
		return 0, "", "", errors.New("job_id is required")
	}
	name = strings.TrimSpace(r.FormValue("name"))
	fh, hdr, err := r.FormFile(resumeFormField)
	if err != nil {
		if errors.Is(err, http.ErrMissingFile) {
			return 0, "", "", errors.New("resume file is required")
		}
		return 0, "", "", err
	}
	defer fh.Close()

	rel, err := storeResumeFile(fh, hdr)
	if err != nil {
		return 0, "", "", err
	}
	return uint(jid), name, rel, nil
}

func storeResumeFile(f multipart.File, hdr *multipart.FileHeader) (string, error) {
	if hdr == nil {
		return "", errors.New("invalid resume upload")
	}
	baseName := strings.TrimSpace(filepath.Base(hdr.Filename))
	if baseName == "" || baseName == "." || baseName == string(filepath.Separator) {
		return "", errors.New("resume must have a valid file name")
	}
	ext := strings.ToLower(filepath.Ext(baseName))
	if !allowedResumeExts[ext] {
		return "", errors.New("resume must be a PDF or Word document (.pdf, .doc, .docx)")
	}
	if hdr.Size > resumeMaxBytes {
		return "", errors.New("resume exceeds maximum size (5 MB)")
	}

	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	storedName := hex.EncodeToString(b) + ext
	relDir := filepath.Join("uploads", "resumes")
	fullDir := filepath.Join(resumeUploadRoot(), relDir)
	if err := os.MkdirAll(fullDir, 0o750); err != nil {
		return "", err
	}
	fullPath := filepath.Join(fullDir, storedName)
	dst, err := os.Create(fullPath)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	n, err := io.Copy(dst, io.LimitReader(f, resumeMaxBytes+1))
	if err != nil {
		_ = os.Remove(fullPath)
		return "", err
	}
	if n > resumeMaxBytes {
		_ = os.Remove(fullPath)
		return "", errors.New("resume exceeds maximum size (5 MB)")
	}

	return filepath.ToSlash(filepath.Join(relDir, storedName)), nil
}
