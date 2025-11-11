import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/FirebaseConfig';

const seedClubs = [
  { name: "FROSH", description: "Freshers society organizing fun campus events.", category: "Social", memberCount: 0 },
  { name: "FAPS", description: "Fine arts, photography, and performing society.", category: "Arts", memberCount: 0 },
  { name: "GDSC", description: "Google Developer Student Club - Learn, Build, Grow.", category: "Tech", memberCount: 0 },
  { name: "TVC", description: "The Visual Club - film and content creators community.", category: "Arts", memberCount: 0 },
  { name: "ENACTUS", description: "Entrepreneurial action for social impact.", category: "Entrepreneurship", memberCount: 0 },
  { name: "ECHOES", description: "Music and performing arts society.", category: "Arts", memberCount: 0 },
  { name: "GENE", description: "Gender equality and empowerment network.", category: "Social", memberCount: 0 },
  { name: "ECON", description: "Economics enthusiasts and analysts' society.", category: "Academic", memberCount: 0 },
  { name: "CCS", description: "Coding & Computer Science Society.", category: "Tech", memberCount: 0 },
  { name: "TAAS", description: "Tech and applied analytics society.", category: "Tech", memberCount: 0 },
  { name: "TNT", description: "Theatre and dramatics club.", category: "Arts", memberCount: 0 },
  { name: "TICC", description: "Tech Innovation and Creativity Club.", category: "Tech", memberCount: 0 },
  { name: "FATEH", description: "Fitness and adventure enthusiasts club.", category: "Sports", memberCount: 0 },
  { name: "VIRSA", description: "Cultural and heritage preservation club.", category: "Cultural", memberCount: 0 },
  { name: "IETE", description: "Electronics and Telecommunication Engineers club.", category: "Academic", memberCount: 0 },
  { name: "TAC", description: "The Art Circle.", category: "Arts", memberCount: 0 },
  { name: "TEDX", description: "TEDx Talks organizing team.", category: "Social", memberCount: 0 },
  { name: "PRATIGYA", description: "Social service and volunteering club.", category: "Social", memberCount: 0 },
  { name: "TMC", description: "The Music Circle.", category: "Arts", memberCount: 0 },
  { name: "ACM", description: "Association for Computing Machinery.", category: "Tech", memberCount: 0 },
];

export async function initializeClubsIfNeeded() {
  try {
    const clubsRef = collection(db, 'clubs');
    const snapshot = await getDocs(clubsRef);
    
    // If clubs already exist, don't reinitialize
    if (snapshot.size > 0) {
      console.log('Clubs already initialized');
      return;
    }

    // Add seed clubs
    for (const club of seedClubs) {
      await addDoc(clubsRef, {
        ...club,
        createdAt: serverTimestamp(),
      });
    }

    console.log('Clubs initialized successfully');
  } catch (error) {
    console.error('Error initializing clubs:', error);
  }
}
