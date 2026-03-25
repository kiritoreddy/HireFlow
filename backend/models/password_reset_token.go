package models

import "time"

// PasswordResetToken stores a one-time reset token (hashed) for a user.
// The raw token is only returned at creation time (demo/dev); only the hash is stored.
type PasswordResetToken struct {
	ID        uint       `gorm:"primaryKey" json:"-"`
	UserID    uint       `gorm:"index;not null" json:"-"`
	TokenHash string     `gorm:"uniqueIndex;not null" json:"-"`
	ExpiresAt time.Time  `gorm:"index;not null" json:"-"`
	UsedAt    *time.Time `gorm:"index" json:"-"`
	CreatedAt time.Time  `json:"-"`
}

