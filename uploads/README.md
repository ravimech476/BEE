# Uploads Directory

This directory stores uploaded files including:
- Product images
- News images  
- Research documents
- User avatars

Files are served statically at `/uploads/*` endpoints.

## File Structure
```
uploads/
├── products/
│   ├── images/
│   └── documents/
├── news/
│   ├── images/
│   └── documents/
├── research/
│   ├── images/
│   └── documents/
└── users/
    └── avatars/
```

**Note:** This directory should have write permissions for the Node.js application.