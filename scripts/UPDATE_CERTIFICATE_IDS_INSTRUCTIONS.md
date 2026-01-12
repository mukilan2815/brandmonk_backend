# Update Video Editing Certificate IDs

## Quick Instructions

### Step 1: Open Terminal in Backend Directory
Make sure you're in the backend directory:
```bash
cd c:\Users\Kingpin\Downloads\Projects\brand_monk_academy\backend
```

### Step 2: Run the Update Script
```bash
node scripts/updateVECertificateIds.js
```

## What This Script Does

This script will:
1. Connect to your MongoDB database
2. Find all students with `courseSlug: 'video-editing'`
3. Match each student by name with the certificate ID mapping
4. Update their certificate IDs to the correct ones from your list

## Expected Output

You should see output like:
```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB

📊 Found X Video Editing students in database

🔄 Updated: SURYA A
   Old ID: BMAVE0001
   New ID: BMANOVVEMES/Q1401S05

✓ Already correct: M. SABEERA BANU → BMAJANVEMES/Q1401S20

...

========================================
📊 SUMMARY
========================================
🔄 Updated: X
✓ Already Correct: Y
❌ Not Found: Z
📝 Total in List: 31
========================================
```

## Student List Being Updated

The script will update certificate IDs for these 31 students:

1. SURYA A → BMANOVVEMES/Q1401S05
2. M. SABEERA BANU → BMAJANVEMES/Q1401S20
3. SARAN S → BMAJUNVEMES/Q1401S108
4. KISHORE G → BMAJUNVEMES/Q1401S127
5. JEEVA. M → BMAJUNVEMES/Q1401S101
6. REVATHI SUBRAMANIYAM → BMAJUNVEMES/Q1401S133
7. G.SUJIKUMARI → BMAJUNVEMES/Q1401S104
8. SABAREESAN PONNUVEL → BMANOVVEMES/Q1401S12
9. HEMARANGAN G → BMAJUNVEMES/Q1401S122
10. M.AKASH → BMAJUNVEMES/Q1401S125
11. VINOTH VIJAYAKUMAR → BMAJUNVEMES/Q1401S114
12. PRABAKARAN S → BMAJUNVEMES/Q1401S116
13. N.MAHALAKSHMI → BMAJANVEMES/Q1401S23
14. JAYASHREE Y → BMAJANVEMES/Q1401S25
15. SARASWATHI M → BMAJUNVEMES/Q1401S134
16. SIVASANGARI P → BMAJUNVEMES/Q1401S130
17. MOHAMMED AASIF IQBAL S A → BMAJANVEMES/Q1401S39
18. SUVEITHA R → BMAJUNVEMES/Q1401S112
19. SRIKANTH.S → BMAJUNVEMES/Q1401S93
20. JABARAJ J → BMAJUNVEMES/Q1401S99
21. SAKTHIKUMAR K.G → BMAJUNVEMES/Q1401S107
22. ARUN PRASATH S → BMAMARVEMES/Q1401S64
23. POOVARASAN MURUGESAN → BMAJUNVEMES/Q1401S132
24. MONISHA VALLI M V → BMAFEBVEMES/Q1401S31
25. J.LAKSHNANAN → BMAJUNVEMES/Q1401S103
26. SURYA NARAYANAN → BMAJUNVEMES/Q1401S110
27. KARTHIK C → BMAMARVEMES/Q1401S55
28. M.A.KAVINILAVU → BMAJUNVEMES/Q1401S102
29. LOKESH S → BMAJUNVEMES/Q1401S117
30. G.VAISHNAVI → BMAJUNVEMES/Q1401S113
31. THIKA P → BMAJUNVEMES/Q1401S129

## Name Matching

The script uses intelligent name matching:
- Removes extra spaces
- Ignores case differences
- Removes dots and commas
- Tries partial matching if exact match not found

This helps match students even if their names are slightly different in the database.

## After Running the Script

Once the certificate IDs are updated:
1. Go to Admin Dashboard
2. Click "Certificates" tab
3. Upload your certificate template
4. Click "Load Video Editing Students"
5. Click "Generate All Certificates"
6. All certificates will have the correct certificate IDs and QR codes

## Troubleshooting

### If students are "Not Found"
- Check the student names in your database
- They might be spelled differently
- You may need to manually update those students in the admin panel

### If you get a MongoDB connection error
- Make sure your backend server is not running (it locks the database)
- Check your `.env` file has the correct `MONGO_URI`
- Ensure MongoDB is accessible

### If you want to verify the changes
After running the script, you can check in MongoDB or use:
```bash
# In MongoDB shell or Compass
db.coursestudents.find({ courseSlug: 'video-editing' })
```

## Certificate Generator Updates

The certificate generator now includes:
- ✅ Student Name (Tangerine font, brown color)
- ✅ Certificate ID (Poppins font, black color)
- ✅ QR Code (bottom-left corner for verification)

The QR code will link to: `https://yourdomain.com/verify/course/{certificateId}`

When scanned, it will verify the certificate authenticity using the certificate ID.
