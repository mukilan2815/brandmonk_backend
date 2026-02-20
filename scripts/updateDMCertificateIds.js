const mongoose = require('mongoose');
const dotenv = require('dotenv');
const CourseStudent = require('../models/CourseStudent');

const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = 'mongodb+srv://mukilan:mukilan@cluster0.c5yb5jt.mongodb.net/brandmonk_academy?appName=Cluster0';

// Mapping of student names to their correct certificate IDs for Digital Marketing
const studentCertificateMapping = [
  { name: "A.AJITH RAJ", certificateId: "BMAJUNDMMES/Q0706S04" },
  { name: "ARIHARAN P", certificateId: "BMAJUNDMMES/Q0706S51" },
  { name: "KOWSALYA T", certificateId: "BMAJUNDMMES/Q0706S29" },
  { name: "ROHAN S", certificateId: "BMAJUNDMMES/Q0706S307" },
  { name: "S. GOWTHAM", certificateId: "BMAJANDMMES/Q0406S605" },
  { name: "BHARATH S", certificateId: "BMAMARDMMES/Q0706S219" },
  { name: "SELVARAJ", certificateId: "BMAJANDMMES/Q0406S491" },
  { name: "S. RANJITHA", certificateId: "BMADECDMMES/Q0706S111" },
  { name: "KAILASH S", certificateId: "BMAAPRDMMES/Q0706S250" },
  { name: "KEERTHIKA T K", certificateId: "BMANOVDMMES/Q0706S94" },
  { name: "JAYANTHI K", certificateId: "BMAFEBDMMES/Q0706S146" },
  { name: "K R VIVEKKA", certificateId: "BMAFEBDMMES/Q0706S154" },
  { name: "BALAVARSHINI K", certificateId: "BMADECDMMES/Q0706S113" },
  { name: "VINOTHA R", certificateId: "BMAJULDMMES/Q0706S353" },
  { name: "A.MOHAMMED THANSIR", certificateId: "BMAAPRDMMES/Q0706S231" },
  { name: "AYYAPPAN S", certificateId: "BMAAPRDMMES/Q0706S249" },
  { name: "ARUNKUMAR M", certificateId: "BMAJANDMMES/Q0406S291" },
  { name: "PRIYADHARSINI.M", certificateId: "BMAFEBDMMES/Q0706S195" },
  { name: "DHANALAKSHMI B", certificateId: "BMAMAYDMMES/Q0706S261" },
  { name: "ABINAYA.G", certificateId: "BMAJUNDMMES/Q0706S320" },
  { name: "R.K.RUKMANI DEVI", certificateId: "BMAJANDMMES/Q0706S136" },
  { name: "MOHAMED MUSHARAF ALI", certificateId: "BMAJULDMMES/Q0706S340" },
  { name: "PRIYANKA M", certificateId: "BMAJULDMMES/Q0706S362" },
  { name: "K.VIJJAYALAKSHMI", certificateId: "BMAJANDMMES/Q0406S120" },
  { name: "DEEBIKA G", certificateId: "BMAJANDMMES/Q0406S443" },
  { name: "KANNAN S", certificateId: "BMADECDMMES/Q0706S109" },
  { name: "MOHAMMED ARHAM SHAH", certificateId: "BMAFEBDMMES/Q0706S224" },
  { name: "E M PARMESHWAR", certificateId: "BMAMAYDMMES/Q0706S271" },
  { name: "MANIKANDAN. A", certificateId: "BMAMAYDMMES/Q0706S290" },
  { name: "SATHISH KUMAR.S", certificateId: "BMAMARDMMES/Q0706S222" },
  { name: "PAYAL D GOKLANI", certificateId: "BMAJULDMMES/Q0706S325" },
  { name: "K.RAJEEVKARAN", certificateId: "BMADECDMMES/Q0706S110" },
  { name: "ASHA PRATHABAN", certificateId: "BMADECDMMES/Q0706S100" },
  { name: "MANIKANDAN .R", certificateId: "BMAOCTDMMES/Q0706S83" },
  { name: "SANGEETH KUMAR A", certificateId: "BMAMAYDMMES/Q0706S273" },
  { name: "R RAJESH KUMAR", certificateId: "BMAAPRDMMES/Q0706S233" },
  { name: "JANARTHANAN B", certificateId: "BMAJANDMMES/Q0406S885" },
  { name: "K HARSHITHA", certificateId: "BMAMARDMMES/Q0706S210" },
  { name: "SRIKANTH S", certificateId: "BMAFEBDMMES/Q0706S200" },
  { name: "LAKSHMI PRABHA.N", certificateId: "BMAMAYDMMES/Q0706S287" },
  { name: "SANKARANARAYANAN M", certificateId: "BMAAPRDMMES/Q0706S244" },
  { name: "KEERTHIKA K", certificateId: "BMAJANDMMES/Q0406S994" },
  { name: "A. JHANSI MARY", certificateId: "BMAFEBDMMES/Q0706S178" },
  { name: "KAMINI B", certificateId: "BMAJULDMMES/Q0706S329" },
  { name: "SIMHIKA V", certificateId: "BMAJANDMMES/Q0406S668" },
  { name: "ARUL K", certificateId: "BMAJUNDMMES/Q0706S35" },
  { name: "S. YOGANA", certificateId: "BMAJANDMMES/Q0406S210" },
  { name: "JONI JANARTHANAN .C", certificateId: "BMAJANDMMES/Q0406S811" },
  { name: "PRAKASH. S", certificateId: "BMAJANDMMES/Q0406S539" },
  { name: "MUKESH KUMAR K", certificateId: "BMAJANDMMES/Q0406S137" },
  { name: "M. GOPU", certificateId: "BMAJANDMMES/Q0406S729" },
  { name: "BHARATH KUMAR .S", certificateId: "BMAJANDMMES/Q0406S524" },
  { name: "VIDHYA KARTHIK", certificateId: "BMAJANDMMES/Q0406S417" },
  { name: "RAKSHINI S", certificateId: "BMAJANDMMES/Q0406S945" },
  { name: "MANOJKUMAR T", certificateId: "BMAJANDMMES/Q0406S208" },
  { name: "MUHAMMAD FAIZAL KHAN", certificateId: "BMAJANDMMES/Q0406S100" },
  { name: "RUBA RAJ", certificateId: "BMAJANDMMES/Q0406S368" },
  { name: "ALAGIRI PRIYA D", certificateId: "BMAJANDMMES/Q0406S635" },
  { name: "S.SENTAMILSELVI", certificateId: "BMAJANDMMES/Q0406S776" },
  { name: "DHIVYA ANANTH D", certificateId: "BMAJANDMMES/Q0406S260" },
  { name: "SUDHARSAN", certificateId: "BMAJANDMMES/Q0406S202" },
  { name: "NAVEEN RAJ R", certificateId: "BMAAPRDMMES/Q0706S124" },
  { name: "KRISHNA KUMAR S", certificateId: "BMAJANDMMES/Q0406S674" },
  { name: "SIVARAMACHANDRAN VEERAMANI", certificateId: "BMAJANDMMES/Q0406S767" },
  { name: "MONISHA S", certificateId: "BMAJULDMMES/Q0706S376" },
  { name: "MEGALA J", certificateId: "BMAMAYDMMES/Q0706S259" },
  { name: "SIVANI S", certificateId: "BMAJUNDMMES/Q0706S311" },
  { name: "R.S.HARINE", certificateId: "BMAJULDMMES/Q0706S337" },
  { name: "DYANESH R", certificateId: "BMAJULDMMES/Q0706S378" },
  { name: "MADHUMITHA R", certificateId: "BMAJANDMMES/Q0406S692" },
  { name: "KARTHICK PERIYASAMY", certificateId: "BMAJANDMMES/Q0706S141" },
  { name: "ARCHANA R", certificateId: "BMAJULDMMES/Q0706S334" },
  { name: "GUNASEKAR M", certificateId: "BMAMAYDMMES/Q0706S286" },
  { name: "GOPALAKRISHNAN S", certificateId: "BMAJANDMMES/Q0406S206" },
  { name: "DHIVAKAR", certificateId: "BMAJANDMMES/Q0406S360" },
  { name: "SUDHA. C", certificateId: "BMAJANDMMES/Q0406S440" },
  { name: "SIJOY. J", certificateId: "BMAJULDMMES/Q0706S365" },
  { name: "SINDHUJA BALAJI", certificateId: "BMAMAYDMMES/Q0706S256" },
  { name: "GOWTHAMI.T", certificateId: "BMAFEBDMMES/Q0706S186" },
  { name: "A.MOHAMMED ALI", certificateId: "BMAJUNDMMES/Q0706S10" },
  { name: "SAMSON.S", certificateId: "BMAMARDMMES/Q0706S204" },
  { name: "SELVAM M", certificateId: "BMAMAYDMMES/Q0706S284" },
  { name: "L.KRISHNAMOORTHY", certificateId: "BMAJULDMMES/Q0706S359" },
  { name: "K.KAVYA", certificateId: "BMAJUNDMMES/Q0706S305" },
  { name: "YUVARAJ K", certificateId: "BMAJULDMMES/Q0706S352" },
  { name: "BALACHANDAR D", certificateId: "BMAJULDMMES/Q07065374" },
  { name: "KARTHIKEYAN M", certificateId: "BMAMARDMMES/Q0706S223" },
  { name: "GAYATHRI V", certificateId: "BMAOCTDMMES/Q0706S501" },
  { name: "M.SNEHA", certificateId: "BMASEPDMMES/Q0706S422" },
  { name: "GP NARENDRAN KUMAR", certificateId: "BMAMAYDMMES/Q0706S272" },
  { name: "KARTHIKEYAN K", certificateId: "BMAJANDMMES/Q0406S596" },
  { name: "KASHI VISHWANATH", certificateId: "BMAMAYDMMES/Q0706S282" },
  { name: "S.N. SYED AAQIB", certificateId: "BMAJANDMMES/Q0406S978" },
  { name: "S.PURUSHOTHAMAN", certificateId: "BMAJANDMMES/Q0406S812" },
  { name: "MOHAMMED ABDUL SUKKUR A", certificateId: "BMAFEBDMMES/Q0706S190" },
  { name: "RAJKUMAR M", certificateId: "BMAJULDMMES/Q0706S355" },
  { name: "IMMANUEL HORRIES K", certificateId: "BMAAUGDMMES/Q0706S401" },
  { name: "BALAJI R", certificateId: "BMAAUGDMMES/Q0706S396" },
  { name: "P JAYASHRI", certificateId: "BMASEPDMMES/Q0706S414" },
  { name: "BLESSIE S", certificateId: "BMAJULDMMES/Q0706S380" },
  { name: "HARSHNI P", certificateId: "BMASEPDMMES/Q0706S413" },
  { name: "CHINNA DURAI", certificateId: "BMAJANDMMES/Q0406S185" },
  { name: "GURU PREMA DHARSHINI OM", certificateId: "BMAJANDMMES/Q0406S190" },
  { name: "RAMEEZBANU M", certificateId: "BMAJANDMMES/Q0406S133" },
  { name: "C. R. ASHOK", certificateId: "BMAJANDMMES/Q0406S673" },
  { name: "JAYA SREE", certificateId: "BMAJANDMMES/Q0406S879" },
  { name: "PRATHEEBARAN RAMAKRISHNAN", certificateId: "BMAJANDMMES/Q0406S332" },
  { name: "ARAVINDHAN", certificateId: "BMAJANDMMES/Q0406S151" },
  { name: "DARICE ASINA DEVI", certificateId: "BMAJANDMMES/Q0406S198" },
  { name: "SHALINI SUBRAMANI", certificateId: "BMAJANDMMES/Q0406S383" },
  { name: "D SARANYA KARTHICK", certificateId: "BMAJANDMMES/Q0406S820" },
  { name: "B.AHAMED MUJJAMIL", certificateId: "BMAJANDMMES/Q0406S412" },
  { name: "P.SUBA", certificateId: "BMAJANDMMES/Q0406S364" },
  { name: "R.SATHIYAVATHI", certificateId: "BMAJANDMMES/Q0406S184" },
  { name: "MURALIKANTH G", certificateId: "BMAJANDMMES/Q0406S290" },
  { name: "KUPPILI SRUTHI", certificateId: "BMAJANDMMES/Q0406S735" },
  { name: "S.GAYATHRI", certificateId: "BMAJANDMMES/Q0406S968" },
  { name: "SATHISHKUMAR M", certificateId: "BMAJANDMMES/Q0406S519" },
  { name: "GAYATHRI SELVARAJ", certificateId: "BMAJANDMMES/Q0406S869" },
  { name: "ROHITH G", certificateId: "BMAJANDMMES/Q0406S312" },
  { name: "S.VINOTHINI", certificateId: "BMAJANDMMES/Q0406S525" },
  { name: "G.SUGANYADEVI", certificateId: "BMAJANDMMES/Q0406S344" },
  { name: "B. KAMALI", certificateId: "BMAJANDMMES/Q0406S458" },
  { name: "ASWANI. MS", certificateId: "BMAJANDMMES/Q0406S695" },
  { name: "VARUN MOGLI", certificateId: "BMAJANDMMES/Q0406S213" },
  { name: "JANANI D", certificateId: "BMAJANDMMES/Q0406S808" },
  { name: "SYED ABDULLAH S I", certificateId: "BMAJANDMMES/Q0406S165" },
  { name: "INDHUMATHI GV", certificateId: "BMAJANDMMES/Q0406S282" },
  { name: "SARULATHA M", certificateId: "BMAJANDMMES/Q0406S950" },
  { name: "K.GEETHA", certificateId: "BMAJANDMMES/Q0406S161" },
  { name: "RUTH SALLY GOMEZ", certificateId: "BMAJANDMMES/Q0406S350" },
  { name: "RABIN AROKIANATHAN", certificateId: "BMAJANDMMES/Q0406S158" },
  { name: "LEO. A", certificateId: "BMAJANDMMES/Q0406S657" },
  { name: "FRANCIS J", certificateId: "BMAJANDMMES/Q0406S691" },
  { name: "YAGA ROOBINI", certificateId: "BMAJUNDMMES/Q0706S313" },
  { name: "SUDHAKAR G", certificateId: "BMAJANDMMES/Q0406S969" },
  { name: "SAVARI ARUN U", certificateId: "BMAJANDMMES/Q0406S392" },
  { name: "ABINAYA T", certificateId: "BMAJANDMMES/Q0406S175" },
  { name: "M.ISHWARYA", certificateId: "BMAJANDMMES/Q0406S972" },
  { name: "YUVAREKHA A", certificateId: "BMAJANDMMES/Q0406S288" },
  { name: "ARULHARI S", certificateId: "BMAJANDMMES/Q0406S636" },
  { name: "S RAGUL", certificateId: "BMAJANDMMES/Q0406S908" },
  { name: "KARTHIKRAJA V", certificateId: "BMAJANDMMES/Q0406S914" },
  { name: "RAMSANKAR", certificateId: "BMAJANDMMES/Q0406S442" }
];

// Helper function to normalize names for comparison
function normalizeName(name) {
  return name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/\./g, '')
    .replace(/,/g, '');
}

async function updateDMCertificateIds() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all Digital Marketing students
    const allStudents = await CourseStudent.find({ 
      courseSlug: 'digital-marketing' 
    });

    console.log(`\n📊 Found ${allStudents.length} Digital Marketing students in database\n`);

    let updated = 0;
    let notFound = 0;
    let alreadyCorrect = 0;

    for (const mapping of studentCertificateMapping) {
      const normalizedMappingName = normalizeName(mapping.name);
      
      // Try to find the student by exact name match first
      let student = allStudents.find(s => 
        normalizeName(s.name) === normalizedMappingName
      );

      // If not found, try partial match
      if (!student) {
        student = allStudents.find(s => {
          const normalizedDbName = normalizeName(s.name);
          return normalizedDbName.includes(normalizedMappingName) || 
                 normalizedMappingName.includes(normalizedDbName);
        });
      }

      if (student) {
        if (student.certificateId === mapping.certificateId) {
          console.log(`✓ Already correct: ${student.name} → ${mapping.certificateId}`);
          alreadyCorrect++;
        } else {
          const oldId = student.certificateId;
          student.certificateId = mapping.certificateId;
          await student.save();
          console.log(`🔄 Updated: ${student.name}`);
          console.log(`   Old ID: ${oldId}`);
          console.log(`   New ID: ${mapping.certificateId}`);
          updated++;
        }
      } else {
        console.log(`❌ Not found in database: ${mapping.name}`);
        notFound++;
      }
    }

    console.log('\n========================================');
    console.log('📊 SUMMARY');
    console.log('========================================');
    console.log(`🔄 Updated: ${updated}`);
    console.log(`✓ Already Correct: ${alreadyCorrect}`);
    console.log(`❌ Not Found: ${notFound}`);
    console.log(`📝 Total in List: ${studentCertificateMapping.length}`);
    console.log('========================================\n');

    if (notFound > 0) {
      console.log('⚠️  Students not found in database:');
      console.log('These students may need to be added manually or their names might be different in the database.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

updateDMCertificateIds();
