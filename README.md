# YouTube Audio Extractor

## Overview

This is a full-stack web application that allows users to extract audio segments from both YouTube videos and uploaded MP3 files. Users can input a YouTube URL or upload an MP3 file, define multiple time-based selections, and download individual MP3 files for each segment. The application uses a modern React frontend with shadcn/ui components and an Express.js backend with PostgreSQL database integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and dark mode support
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Validation**: Zod schemas for request/response validation
- **External Tools**: 
  - yt-dlp for YouTube video information and downloading
  - FFmpeg for audio processing and segmentation

### Data Storage Solutions
- **Primary Database**: PostgreSQL (configured for Neon serverless)
- **File Storage**: Local filesystem for temporary audio files
- **Session Storage**: In-memory storage for development (extensible to PostgreSQL sessions)

## Key Components

### Database Schema
- **Videos Table**: Stores video/audio metadata (YouTube URL or uploaded file path, source type, title, duration, thumbnail, channel, status)
- **Selections Table**: Defines time-based segments within videos (start/end times, titles, file paths)
- **Jobs Table**: Tracks processing status and progress for video operations

### API Endpoints
- `POST /api/youtube/validate` - Validates YouTube URLs and retrieves video information
- `POST /api/upload` - Handles MP3 file uploads and extracts metadata
- `POST /api/process` - Initiates audio extraction job for specified video/audio segments (supports both YouTube and uploaded files)
- `GET /api/jobs/:id` - Retrieves job status and associated selections for progress tracking

### Frontend Components
- **YouTubeInput**: URL validation and video information display
- **AudioUpload**: MP3 file upload with drag-and-drop support and metadata extraction
- **SelectionsManager**: Interface for defining multiple time-based audio segments
- **ProcessingCard**: Job initiation and configuration summary (supports both source types)
- **DownloadsCard**: Real-time progress tracking and download management

### Services
- **YouTubeService**: Handles video validation and metadata extraction using yt-dlp
- **AudioService**: Manages audio segment extraction using FFmpeg
- **Storage Interface**: Abstracted data layer supporting both in-memory and database persistence

## Data Flow

1. **Audio Input**: 
   - **YouTube**: User submits YouTube URL → Backend validates with yt-dlp → Returns video metadata
   - **Upload**: User uploads MP3 file → Backend extracts metadata with FFprobe → Returns audio information
2. **Selection Definition**: User defines time segments → Frontend validates and manages selection state
3. **Processing Initiation**: User submits job → Backend creates video/selections/job records → Initiates audio processing
4. **Audio Extraction**: Background process downloads video (YouTube) or uses uploaded file → Extracts specified segments → Saves MP3 files
5. **Progress Tracking**: Frontend polls job status → Displays real-time progress → Enables downloads when complete

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless driver for database connectivity
- **drizzle-orm**: Type-safe ORM for database operations with PostgreSQL dialect
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Headless UI primitives for accessible components
- **tailwindcss**: Utility-first CSS framework

### System Requirements
- **yt-dlp**: Command-line tool for YouTube video processing
- **FFmpeg**: Media processing framework for audio extraction
- **PostgreSQL**: Database server (configured for Neon serverless)

### Development Tools
- **Vite**: Fast build tool with HMR and TypeScript support
- **TypeScript**: Static type checking across frontend and backend
- **Drizzle Kit**: Database migration and schema management

## Deployment Strategy

### Build Process
- Frontend builds to `dist/public` directory via Vite
- Backend bundles to `dist/index.js` via esbuild with external package handling
- Database migrations managed through Drizzle Kit

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string (required)
- `NODE_ENV`: Environment flag for development/production behavior
- Development includes Vite dev server with HMR
- Production serves static frontend files from Express

### Architecture Decisions
- **Monorepo Structure**: Shared schema and types between frontend/backend in `shared/` directory
- **Type Safety**: End-to-end TypeScript with Zod validation for runtime safety
- **Progressive Enhancement**: Works without JavaScript for basic functionality
- **Scalable Storage**: Abstract storage interface allows switching from in-memory to database persistence
- **Real-time Updates**: Polling-based progress tracking (extensible to WebSockets)

The application follows a traditional client-server architecture with clear separation of concerns, type-safe data flow, and modern development tooling for maintainability and developer experience.

## Recent Changes

### January 26, 2025
- **Added MP3 Upload Feature**: Implemented file upload alternative to YouTube URLs to bypass anti-bot restrictions
- **Enhanced Database Schema**: Updated videos table to support both YouTube URLs and uploaded files with source type differentiation
- **Dual Input Interface**: Created tabbed interface allowing users to choose between YouTube URL input and MP3 file upload
- **File Processing**: Added FFprobe integration for extracting metadata from uploaded MP3 files
- **Unified Processing**: Updated processing pipeline to handle both YouTube downloads and uploaded files seamlessly