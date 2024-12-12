package util

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type FileLogger struct {
	*log.Logger
	mu            sync.Mutex
	currentFile   *os.File
	currentLines  int
	maxLines      int
	logDirectory  string
}

// NewFileLogger creates a new logger that writes to timestamped files
func NewFileLogger(logDirectory string) (*FileLogger, error) {
	// Create logs directory if it doesn't exist
	if err := os.MkdirAll(logDirectory, 0755); err != nil {
		return nil, fmt.Errorf("failed to create log directory: %w", err)
	}

	logger := &FileLogger{
		maxLines:     10000,
		logDirectory: logDirectory,
	}

	if err := logger.rotateFile(); err != nil {
		return nil, err
	}

	return logger, nil
}

// rotateFile creates a new log file with timestamp
func (l *FileLogger) rotateFile() error {
	l.mu.Lock()
	defer l.mu.Unlock()

	// Close current file if it exists
	if l.currentFile != nil {
		l.currentFile.Close()
	}

	// Create new file with timestamp
	timestamp := time.Now().Format("2006-01-02T150405")
	filename := filepath.Join(l.logDirectory, fmt.Sprintf("%s.log", timestamp))
	
	file, err := os.OpenFile(filename, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return fmt.Errorf("failed to create new log file: %w", err)
	}

	l.currentFile = file
	l.Logger = log.New(file, "", log.LstdFlags)
	l.currentLines = 0

	return nil
}

// Write implements io.Writer and handles line counting and rotation
func (l *FileLogger) Write(p []byte) (n int, err error) {
	l.mu.Lock()
	defer l.mu.Unlock()

	// Count newlines in the input
	newLines := 0
	for _, b := range p {
		if b == '\n' {
			newLines++
		}
	}

	// Check if we need to rotate
	if l.currentLines + newLines > l.maxLines {
		if err := l.rotateFile(); err != nil {
			return 0, err
		}
	}

	n, err = l.currentFile.Write(p)
	if err == nil {
		l.currentLines += newLines
	}
	return n, err
}

// Close closes the current log file
func (l *FileLogger) Close() error {
	l.mu.Lock()
	defer l.mu.Unlock()

	if l.currentFile != nil {
		return l.currentFile.Close()
	}
	return nil
}