# 🚀 Invoice-to-Delivery Permission Scripts

## 📋 Quick Commands

```bash
# Add permission (Enable feature)
npm run add-invoice-delivery-permission

# Remove permission (Disable feature)
npm run remove-invoice-delivery-permission
```

## ✅ Add Permission Script

### **What it does:**
- Finds all active customer roles
- Adds `invoice_to_delivery` permission with `view: true`
- Skips roles that already have permission
- Shows detailed output

### **Usage:**
```bash
cd D:\CC\BE
npm run add-invoice-delivery-permission
```

## ❌ Remove Permission Script

### **What it does:**
- Finds roles with `invoice_to_delivery` permission  
- Removes the permission
- Shows detailed output

### **Usage:**
```bash
cd D:\CC\BE
npm run remove-invoice-delivery-permission
```

## 📝 Testing

After running add script:
1. Customer logs out
2. Logs back in
3. Checks sidebar for "🚚 Invoice to Delivery"
4. Tests the feature

## 🐛 Troubleshooting

**Script won't run?**
- Check you're in `D:\CC\BE` directory
- Make sure database connection works
- Backend should NOT be running while script runs

**Permission not showing?**
- Run script again
- Customer must logout and login
- Clear browser cache
