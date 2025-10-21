# Product Images

This directory contains product images that are served via the API.

## Sample Images for Testing

For the Jasmine Grandiflorum product, you can place these files:
- `jasmine_grandiflorum_1.jpg` - Main product image
- `jasmine_grandiflorum_2.jpg` - Additional product image

## URL Format

Images in this directory will be accessible at:
```
http://localhost:5000/uploads/products/images/filename.jpg
```

## API Response Format

The product API will return:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "product_number": "0989733832",
    "product_name": "Jasmine Grandiflorum",
    "product_image1": "products/images/jasmine_grandiflorum_1.jpg",
    "product_image2": "products/images/jasmine_grandiflorum_2.jpg",
    "image1_url": "http://localhost:5000/uploads/products/images/jasmine_grandiflorum_1.jpg",
    "image2_url": "http://localhost:5000/uploads/products/images/jasmine_grandiflorum_2.jpg",
    ...other fields
  }
}
```

## Testing

1. Place actual image files in this directory
2. Update the database with the image paths
3. Test the API endpoint to see full URLs
