const mongoose = require('mongoose');
const Student = require('../models/Student');
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

const removeStudents = async () => {
    await connectDB();

    const dmNames = cleanNames(dmNamesRaw);
    const veNames = cleanNames(veNamesRaw);

    console.log(`Checking ${dmNames.length} names for Digital Marketing removal...`);
    let dmRemovedCount = 0;
    for (const name of dmNames) {
        const result = await Student.findOneAndDelete({ 
            name: name,
            webinarSlug: 'digital-marketing'
        });
        
        if (result) {
            console.log(`[DELETED] DM: ${name} (${result._id})`);
            dmRemovedCount++;
        }
    }
    console.log(`Total Digital Marketing students removed: ${dmRemovedCount}`);

    console.log(`Checking ${veNames.length} names for Video Editing removal...`);
    let veRemovedCount = 0;
    for (const name of veNames) {
        const result = await Student.findOneAndDelete({ 
            name: name,
            webinarSlug: 'video-editing'
        });
        
        if (result) {
            console.log(`[DELETED] VE: ${name} (${result._id})`);
            veRemovedCount++;
        }
    }
    console.log(`Total Video Editing students removed: ${veRemovedCount}`);

    console.log('Removal process complete.');
    process.exit();
};

removeStudents();
