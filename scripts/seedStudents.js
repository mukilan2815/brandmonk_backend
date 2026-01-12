const mongoose = require('mongoose');
const Student = require('../models/Student');
const Webinar = require('../models/Webinar');
require('dotenv').config();

const dmNamesRaw = `
A.AJITH RAJ
Kashi Vishwanath 
Balaji R
Ariharan P
Kowsalya T
Syed Abdullah S I
Balaji R
R.S.HARINE 
Rohan S
S. Gowtham
Bharath S
SINDHUJA BALAJI
Selvaraj
Gayathri V
Indhumathi G.V
S. RANJITHA 
GUNASEKAR M 
Karthikeyan M
KARTHIKEYAN K
Kailash S
Keerthika T K
Jayanthi K
MUKESH KUMAR K
K R VIVEKKA 
ROHITH G
Balavarshini K 
T.GOWTHAMI
VINOTHA R
A.Mohammed thansir 
AYYAPPAN S
G. Suganyadevi
Arunkumar M
Priyadharsini.M
DHANALAKSHMI B
Abinaya.G
R.K.Rukmani devi
MOHAMED MUSHARAF ALI
Suba P
PRIYANKA M
Barath Navin B
k.vijjayalakshmi 
GP Narendran kumar
Deebika G
Dhivya Ananth D
Archana R
D SARANYA KARTHICK 
Yaga Roobini S
Sudha C
SIMHIKA V 
KANNAN S 
Dhivakar k
Mohammed Arham Shah
E M Parmeshwar
SUDHAKAR G
MANIKANDAN. A
Sathish Kumar.s
Payal D Goklani
K.Rajeevkaran
Asha Prathaban
Manikandan .R
JONI JANARTHANAN C
Sangeeth kumar A
R RAJESH KUMAR
JANARTHANAN B
K ARUL 
S.Gopalakrishnan
K Harshitha 
SRIKANTH S
LAKSHMI PRABHA.N
KARTHIKRAJA V
Sankaranarayanan M
Keerthika k
A. JHANSI MARY
Kamini B
SIMHIKA V 
ARUL K 
Sivaramachandran veeramai
S. YOGANA 
Joni Janarthanan .C
Archana R 
Prakash. S
Mukesh Kumar K
GUNASEKAR M
M. Gopu
Guru Prema Dharshini Om
Kashi Vishwanath 
Karthikeyan M
ARULHARI S 
Bharath Kumar .S
Vidhya Karthik 
S.Gayathri
RAKSHINI S
MANOJKUMAR T
Muhammad Faizal Khan 
Ruba Raj 
Alagiri Priya D
S.SENTAMILSELVI
Dhivya Ananth D 
Sudharsan
Naveen Raj R
Kuppili Sruthi 
Krishna Kumar S
Syed Abdullah S I
Sivaramachandran Veeramani 
Monisha S
DYANESH R
MEGALA J
K.kavya
SIVANI S 
R.S.HARINE 
DYANESH R
Sivaramachandran veeramani
Syed Abdullah S I
Madhumitha R
KARTHICK Periyasamy 
Archana R
GUNASEKAR M 
Gopalakrishnan S
Karthikeyan M
Dhivakar 
Sudha. C
ROHITH G
Balaji R
Sijoy. J
Sindhuja Balaji
GOWTHAMI.T
A.Mohammed Ali 
KARTHIKRAJA V 
SAMSON.S
SELVAM M
L.KRISHNAMOORTHY
K.kavya
Yuvaraj K
BALACHANDAR D
Sivaramachandran 
K YUVARAJ 
Karthikeyan M
Gayathri V
M.Sneha 
GP Narendran Kumar
Rohith G
S.Gayathri
KARTHIKEYAN K
Kashi Vishwanath 
S.N. SYED AAQIB
S.purushothaman
Mohammed Abdul Sukkur A
Shalini Subramani
Rajkumar M 
IMMANUEL HORRIES K 
B.Ahamed Mujjamil 
BALAJI R
P Jayashri 
Blessie S
Harshni P
Harshni P
CHINNA DURAI
Guru Prema Dharshini Om
Rameezbanu M
C. R. ASHOK
JAYA SREE
 PRATHEEBARAN RAMAKRISHNAN 
Aravindhan 
Darice Asina Devi 
Shalini Subramani
D SARANYA KARTHICK 
B.Ahamed Mujjamil 
P.Suba
R.Sathiyavathi
Muralikanth G
Kuppili Sruthi 
S.Gayathri
SATHISHKUMAR M 
SATHISHKUMAR M 
Gayathri Selvaraj 
Rohith G
S.VINOTHINI 
G.Suganyadevi 
B. KAMALI 
ASWANI.MS
`;

const veNamesRaw = `
SURYA A
M. SABEERA BANU 
M.Akash
Saran S
Mohammed Aasif Iqbal S A
KISHORE G
Suveitha R
JEEVA. M
vinoth vijayakumar
Revathi Subramaniyam
M.A.KAVINILAVU
J.Lakshmanan
Sakthikumar
G.SUJIKUMARI
Sabareesan Ponnuvel
G.Vaishnavi
ARUN PRASATH S 
Hemarangan G
M.Akash
vinoth vijayakumar
Prabakaran S
Lokesh S
Srikanth.s
N.Mahalakshmi
Jayashree Y
Saraswathi M
Jabaraj j
Sivasangari P 
Mohammed Aasif Iqbal S A 
M.Akash
Suveitha R
Srikanth.s
Jabaraj J
N. Mahalakshmi
Sakthikumar K.G
ARUN PRASATH S
Poovarasan Murugesan 
Monisha Valli M V 
J.Lakshnanan
Lokesh S
M.A.KAVINILAVU
Surya Narayanan 
KARTHIK C
M.A.KAVINILAVU
Lokesh S
THIKA P
Bindhu N
Mugilarasu G
SIKENDAR BASHA M
Vishnusithan A
G.Vaishnavi
Vishnusithan A
Vidhyambigai S
THIKA P
`;

const cleanNames = (text) => text.split('\n').map(n => n.trim()).filter(n => n && n.length > 0);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const seed = async () => {
    await connectDB();

    const dmNames = cleanNames(dmNamesRaw);
    const veNames = cleanNames(veNamesRaw);

    // 1. Ensure Webinars
    const webinars = [
        { name: 'Digital Marketing', slug: 'digital-marketing', batchCode: 'DM01' },
        { name: 'Video Editing', slug: 'video-editing', batchCode: 'VE01' }
    ];

    const webinarMap = {};

    for (const w of webinars) {
        let webinar = await Webinar.findOne({ slug: w.slug });
        if (!webinar) {
            webinar = new Webinar({
                name: w.name,
                slug: w.slug,
                type: 'Course',
                createdBy: 'admin',
                date: new Date(),
                batchCode: w.batchCode
            });
            await webinar.save();
            console.log(`Created Course: ${w.name}`);
        } else {
            console.log(`Found Course: ${w.name}`);
        }
        webinarMap[w.slug] = webinar;
    }

    // 2. Process Students
    const processBatch = async (names, slug) => {
        const webinar = webinarMap[slug];
        console.log(`Processing ${names.length} students for ${slug}...`);

        let count = 0;
        
        // Fetch last ID once to start
        const lastStudents = await Student.find({
            certificateId: { $regex: /^SMAPARMQ076/ }
        }).sort({ createdAt: -1 }).limit(1);
        
        let nextNum = 1;
        if (lastStudents[0] && lastStudents[0].certificateId) {
             const match = lastStudents[0].certificateId.match(/SMAPARMQ076(\d+)/);
             if (match) nextNum = parseInt(match[1], 10) + 1;
        }

        for (const name of names) {
            // Check duplicate by name in this webinar
            const existing = await Student.findOne({ 
                name: name, // Case sensitivity?
                webinarId: webinar._id 
            });

            if (existing) {
                // console.log(`Skipping existing: ${name}`);
                continue;
            }

            const certificateId = `SMAPARMQ076${nextNum.toString().padStart(3, '0')}`;
            nextNum++;

            const dummyEmail = `${name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}${Date.now()}@bma.temp`;

            const student = new Student({
                name: name,
                email: dummyEmail,
                phone: '0000000000',
                webinarId: webinar._id,
                webinarName: webinar.name,
                webinarSlug: webinar.slug,
                location: 'Unknown',
                profession: 'Student',
                certificateId,
                isEligible: true, // Assuming eligible for certificate
                hasFollowedInstagram: true,
                certificateSent: false,
                dateOfRegistration: new Date()
            });

            await student.save();
            count++;
            
            // Periodically log
            if (count % 10 === 0) console.log(`Added ${count} students...`);
        }
        console.log(`Finished ${slug}. Added ${count} new students.`);
    };

    await processBatch(dmNames, 'digital-marketing');
    await processBatch(veNames, 'video-editing');

    console.log('Seeding Complete');
    process.exit();
};

seed();
