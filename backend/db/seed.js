const fs = require('fs');
const path = require('path');
const db = require('../backend/src/db');
const { hashPassword } = require('../backend/src/utils/helpers');

async function seedRealStores() {
  console.log('🇮🇳 Seeding authentic real restaurants and iconic stores across all of India...');

  // Reset database tables
  db.exec(`
    DELETE FROM favourites;
    DELETE FROM messages;
    DELETE FROM leads;
    DELETE FROM reviews;
    DELETE FROM businesses;
    DELETE FROM categories;
    DELETE FROM users;
    DELETE FROM sqlite_sequence;
  `);

  // 1. Users
  console.log('👤 Seeding accounts...');
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@locafy.in').toLowerCase();
  const defaultUserPass = await hashPassword('Password123!');
  const adminPassHash = await hashPassword(adminPassword);

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now', ?))
  `);

  const adminRes = insertUser.run('Locafy Admin', adminEmail, '+91 98765 43210', adminPassHash, 'admin', '-30 days');
  const owner1Res = insertUser.run('Ankit Rawal', 'ankit@spiceroute.com', '+91 98111 22334', defaultUserPass, 'business', '-28 days');
  const owner2Res = insertUser.run('Vikram Sethi', 'vikram@urbanglow.com', '+91 98222 33445', defaultUserPass, 'business', '-25 days');
  const user1Res = insertUser.run('Priya Malhotra', 'priya@example.com', '+91 98333 44556', defaultUserPass, 'user', '-20 days');
  const user2Res = insertUser.run('Sana Iqbal', 'sana@example.com', '+91 98444 55667', defaultUserPass, 'user', '-15 days');
  const user3Res = insertUser.run('Rahul Verma', 'rahul@example.com', '+91 98555 66778', defaultUserPass, 'user', '-10 days');

  const owner1Id = Number(owner1Res.lastInsertRowid);
  const owner2Id = Number(owner2Res.lastInsertRowid);
  const user1Id = Number(user1Res.lastInsertRowid);
  const user2Id = Number(user2Res.lastInsertRowid);
  const user3Id = Number(user3Res.lastInsertRowid);

  // 2. Categories
  console.log('🏷️ Seeding categories...');
  const categoriesData = [
    { name: 'Restaurants', slug: 'restaurants', icon: 'utensils', color: '#EF4444' },
    { name: 'Salons & Spa', slug: 'salons', icon: 'scissors', color: '#EC4899' },
    { name: 'Home Decor', slug: 'home-decor', icon: 'couch', color: '#8B5CF6' },
    { name: 'Education', slug: 'education', icon: 'graduation-cap', color: '#3B82F6' },
    { name: 'Hospitals', slug: 'hospitals', icon: 'hospital', color: '#10B981' },
    { name: 'Real Estate', slug: 'realestate', icon: 'building', color: '#F59E0B' },
    { name: 'Repairs', slug: 'repairs', icon: 'wrench', color: '#6366F1' },
    { name: 'Pet Care', slug: 'pet-care', icon: 'paw', color: '#14B8A6' },
    { name: 'Gyms', slug: 'gyms', icon: 'dumbbell', color: '#F97316' },
    { name: 'Events', slug: 'events', icon: 'glass-cheers', color: '#A855F7' },
    { name: 'Movers', slug: 'movers', icon: 'truck', color: '#06B6D4' },
    { name: 'Healthcare', slug: 'healthcare', icon: 'heartbeat', color: '#059669' }
  ];

  const insertCategory = db.prepare('INSERT INTO categories (name, slug, icon, color) VALUES (?, ?, ?, ?)');
  const catMap = {};
  for (const cat of categoriesData) {
    const res = insertCategory.run(cat.name, cat.slug, cat.icon, cat.color);
    catMap[cat.slug] = Number(res.lastInsertRowid);
  }

  // Helpers
  const standardHours = (open = '10:00', close = '23:00') => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const h = {};
    for (const d of days) {
      h[d] = { open, close, closed: false };
    }
    return JSON.stringify(h);
  };

  const makeGallery = (...imgs) => JSON.stringify(imgs);

  // 3. REAL INDIAN RESTAURANTS & STORES ACROSS ALL REGIONS
  console.log('🏢 Seeding real stores across India...');
  const realBusinesses = [
    // --- DELHI NCR RESTAURANTS ---
    {
      name: "Karim's Historic Mughlai",
      category: 'restaurants',
      description: "Legendary Mughlai institution established in 1913 near Jama Masjid. World famous for Mutton Nihari, Seekh Kebabs, Badam Pasanda, and fresh tandoori Khamiri rotis.",
      phone: '+91 11 2326 9880',
      whatsapp: '+91 98111 23269',
      email: 'info@karimhoteldelhi.com',
      website: 'https://karimhoteldelhi.com',
      address: '16 Gali Kababian, Jama Masjid, Old Delhi',
      area: 'Old Delhi',
      city: 'Delhi',
      pincode: '110006',
      lat: 28.6507,
      lng: 77.2334,
      image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('09:00', '23:30'),
      is_verified: 1,
      avg_rating: 4.8,
      review_count: 320
    },
    {
      name: "Bukhara - ITC Maurya",
      category: 'restaurants',
      description: "World-renowned North-Western frontier cuisine restaurant. Globally celebrated for its iconic Dal Bukhara slow-cooked for 18 hours, Sikandari Raan, and jumbo Tandoori Naan.",
      phone: '+91 11 2611 2233',
      whatsapp: '+91 98111 26112',
      email: 'bukhara.itcmaurya@itchotels.in',
      website: 'https://itchotels.com',
      address: 'ITC Maurya, Diplomatic Enclave, Chanakyapuri',
      area: 'Chanakyapuri',
      city: 'Delhi',
      pincode: '110021',
      lat: 28.5975,
      lng: 77.1735,
      image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('12:30', '23:45'),
      is_verified: 1,
      avg_rating: 4.9,
      review_count: 512
    },
    {
      name: "Indian Accent",
      category: 'restaurants',
      description: "Ranked among Asia's 50 Best Restaurants, Chef Manish Mehrotra crafts contemporary progressive Indian cuisine reimagined with global ingredients.",
      phone: '+91 11 6617 5151',
      whatsapp: '+91 98111 66175',
      email: 'reservations.del@indianaccent.com',
      website: 'https://indianaccent.com',
      address: 'The Lodhi, Lodhi Road',
      area: 'Lodhi Road',
      city: 'Delhi',
      pincode: '110003',
      lat: 28.5919,
      lng: 77.2375,
      image_url: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('12:00', '23:00'),
      is_verified: 1,
      avg_rating: 4.9,
      review_count: 410
    },
    {
      name: "Gulati Restaurant Pandara Road",
      category: 'restaurants',
      description: "Delhi's holy grail for Butter Chicken, Dal Makhani, Kakori Kebabs, and aromatic Dum Biryani since 1952 in the legendary late-night Pandara Road market.",
      phone: '+91 11 2338 8836',
      whatsapp: '+91 98111 23388',
      email: 'contact@gulatirestaurant.in',
      website: 'https://gulatirestaurant.in',
      address: '6 Pandara Road Market',
      area: 'India Gate / Pandara',
      city: 'Delhi',
      pincode: '110003',
      lat: 28.6085,
      lng: 77.2360,
      image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('12:00', '00:30'),
      is_verified: 1,
      avg_rating: 4.7,
      review_count: 289
    },
    {
      name: "Haldiram's Sweets & Thali",
      category: 'restaurants',
      description: "Iconic Indian sweets and pure vegetarian culinary powerhouse. Renowned for crispy Raj Kachori, Chhole Bhature, Pao Bhaji, Kaju Katli, and Rasmalai.",
      phone: '+91 11 4768 5100',
      whatsapp: '+91 98111 47685',
      email: 'support@haldirams.com',
      website: 'https://haldirams.com',
      address: '1454 Chandni Chowk, Near Fountain',
      area: 'Chandni Chowk',
      city: 'Delhi',
      pincode: '110006',
      lat: 28.6562,
      lng: 77.2307,
      image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('08:30', '22:30'),
      is_verified: 1,
      avg_rating: 4.6,
      review_count: 360
    },
    {
      name: "Saravanaa Bhavan Connaught Place",
      category: 'restaurants',
      description: "Pure South Indian vegetarian breakfast and meals. Crispy Ghee Roast Masala Dosa, hot steamed idlis, medu vada, and authentic Kumbakonam degree filter coffee.",
      phone: '+91 11 2331 6060',
      whatsapp: '+91 98111 23316',
      email: 'delhi@saravanabhavan.com',
      website: 'https://saravanabhavan.com',
      address: 'P-13/90 Connaught Circus, Outer Circle',
      area: 'Connaught Place',
      city: 'Delhi',
      pincode: '110001',
      lat: 28.6328,
      lng: 77.2195,
      image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('08:00', '23:00'),
      is_verified: 1,
      avg_rating: 4.6,
      review_count: 245
    },
    {
      name: "Cyber Hub Social",
      category: 'restaurants',
      description: "Vibrant high-energy co-working space and gourmet cafe serving innovative street food, artisanal burgers, craft beers, and signature LIITs.",
      phone: '+91 78380 12075',
      whatsapp: '+91 78380 12075',
      email: 'cyberhub@socialoffline.in',
      website: 'https://socialoffline.in',
      address: 'Shop 04A, Ground Floor, DLF Cyber Hub',
      area: 'DLF Phase 2',
      city: 'Gurugram',
      pincode: '122002',
      lat: 28.4950,
      lng: 77.0895,
      image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('11:00', '01:00'),
      is_verified: 1,
      avg_rating: 4.7,
      review_count: 198
    },
    {
      name: "Bikanervala Heritage Sector 18",
      category: 'restaurants',
      description: "A flagship family dining haven in Noida Sector 18. Famous for royal Rajasthani Thalis, Motichoor Ladoos, Paneer Tikka, and mouth-watering Delhi chaat.",
      phone: '+91 120 435 0000',
      whatsapp: '+91 98111 43500',
      email: 'noida@bikanervala.com',
      website: 'https://bikanervala.com',
      address: 'E-Block, Sector 18 Market',
      area: 'Sector 18',
      city: 'Noida',
      pincode: '201301',
      lat: 28.5708,
      lng: 77.3242,
      image_url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('09:00', '22:30'),
      is_verified: 1,
      avg_rating: 4.5,
      review_count: 172
    },

    // --- MUMBAI RESTAURANTS ---
    {
      name: "Britannia & Co. Restaurant",
      category: 'restaurants',
      description: "Legendary 1923 Parsi institution in South Mumbai. World-renowned for fragrant Mutton & Chicken Berry Pulao, Sali Boti, Patra Ni Machhi, and Caramel Custard.",
      phone: '+91 22 2261 5264',
      whatsapp: '+91 98222 22615',
      email: 'info@britanniarestaurant.in',
      website: 'https://britanniarestaurant.in',
      address: 'Wakefield House, 11 Sprott Road, Ballard Estate, Fort',
      area: 'Fort',
      city: 'Mumbai',
      pincode: '400001',
      lat: 18.9348,
      lng: 72.8398,
      image_url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('11:30', '16:30'),
      is_verified: 1,
      avg_rating: 4.8,
      review_count: 340
    },
    {
      name: "Bademiya Kebabs Colaba",
      category: 'restaurants',
      description: "Mumbai's most famous open-air culinary landmark behind Taj Mahal Palace. Celebrated for seekh kebabs, mutton baida roti, chicken bhuna roll, and rumali rotis.",
      phone: '+91 22 2284 8038',
      whatsapp: '+91 98222 22848',
      email: 'feedback@bademiya.com',
      website: 'https://bademiya.com',
      address: 'Tulloch Road, Behind Taj Mahal Hotel, Apollo Bunder, Colaba',
      area: 'Colaba',
      city: 'Mumbai',
      pincode: '400039',
      lat: 18.9215,
      lng: 72.8335,
      image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('12:00', '03:00'),
      is_verified: 1,
      avg_rating: 4.6,
      review_count: 420
    },
    {
      name: "Leopold Cafe & Bar",
      category: 'restaurants',
      description: "Historic 1871 heritage cafe immortalized in Gregory David Roberts' 'Shantaram'. Popular for chilled beer towers, chicken stroganoff, chili chicken, and continental bites.",
      phone: '+91 22 2282 4801',
      whatsapp: '+91 98222 22824',
      email: 'leopoldcafe@gmail.com',
      website: 'https://leopoldcafe.com',
      address: 'Colaba Causeway, Colaba',
      area: 'Colaba',
      city: 'Mumbai',
      pincode: '400001',
      lat: 18.9228,
      lng: 72.8317,
      image_url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('07:30', '00:00'),
      is_verified: 1,
      avg_rating: 4.7,
      review_count: 510
    },
    {
      name: "Trishna Seafood Kala Ghoda",
      category: 'restaurants',
      description: "South Mumbai's temple of Mangalorean coastal cooking. Worldwide praise for Butter Garlic Jumbo Crab, Kolhapuri Prawns, Koliwada fish, and Neer Dosa.",
      phone: '+91 22 2270 3262',
      whatsapp: '+91 98222 22703',
      email: 'trishna.mumbai@gmail.com',
      website: 'https://trishnamumbai.com',
      address: '7 Sai Baba Mandir Marg, Next to Commerce House, Kala Ghoda, Fort',
      area: 'Kala Ghoda',
      city: 'Mumbai',
      pincode: '400001',
      lat: 18.9287,
      lng: 72.8322,
      image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('12:00', '23:30'),
      is_verified: 1,
      avg_rating: 4.8,
      review_count: 275
    },
    {
      name: "The Bombay Canteen",
      category: 'restaurants',
      description: "Acclaimed modern Indian restaurant and bar celebrating India's rich culinary traditions through a fresh, playful seasonal menu and craft cocktail program.",
      phone: '+91 22 4966 6666',
      whatsapp: '+91 98222 49666',
      email: 'reservations@thebombaycanteen.com',
      website: 'https://thebombaycanteen.com',
      address: 'Unit 1, Process House, Kamala Mills, Lower Parel',
      area: 'Lower Parel',
      city: 'Mumbai',
      pincode: '400013',
      lat: 19.0068,
      lng: 72.8306,
      image_url: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('12:00', '01:00'),
      is_verified: 1,
      avg_rating: 4.9,
      review_count: 380
    },

    // --- BENGALURU RESTAURANTS ---
    {
      name: "Mavalli Tiffin Room (MTR)",
      category: 'restaurants',
      description: "Founded in 1924, MTR is Bengaluru's most cherished heritage restaurant. The birthplace of Rava Idli, served with pure ghee, crispy Masala Dosas, and iconic filter coffee.",
      phone: '+91 80 2222 0022',
      whatsapp: '+91 98333 22220',
      email: 'care@mtrheirloom.com',
      website: 'https://mavallitiffinroom.com',
      address: '14 Lalbagh Road, Mavalli',
      area: 'Lalbagh',
      city: 'Bengaluru',
      pincode: '560004',
      lat: 12.9553,
      lng: 77.5861,
      image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('06:30', '21:00'),
      is_verified: 1,
      avg_rating: 4.9,
      review_count: 480
    },
    {
      name: "Vidyarthi Bhavan",
      category: 'restaurants',
      description: "Iconic Basavanagudi vegetarian coffee house running since 1943. Legendary for its extra thick, golden brown, crispy Ghee Masala Dosa and Poori Saagu.",
      phone: '+91 80 2667 7588',
      whatsapp: '+91 98333 26677',
      email: 'vbhavan@gmail.com',
      website: 'https://vidyarthibhavan.in',
      address: '32 Gandhi Bazaar Main Road, Basavanagudi',
      area: 'Basavanagudi',
      city: 'Bengaluru',
      pincode: '560004',
      lat: 12.9438,
      lng: 77.5701,
      image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('06:30', '19:30'),
      is_verified: 1,
      avg_rating: 4.8,
      review_count: 390
    },
    {
      name: "Toit Brewpub Indiranagar",
      category: 'restaurants',
      description: "Pioneering microbrewery of India that started Bengaluru's craft beer revolution. Known for Basmati Blonde, Tint-in-Wit, wood-fired sourdough pizzas, and BBQ wings.",
      phone: '+91 90197 13388',
      whatsapp: '+91 90197 13388',
      email: 'info@toit.in',
      website: 'https://toit.in',
      address: '298 100 Feet Road, Near CMH Road Junction, Indiranagar',
      area: 'Indiranagar',
      city: 'Bengaluru',
      pincode: '560038',
      lat: 12.9792,
      lng: 77.6406,
      image_url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('12:00', '01:00'),
      is_verified: 1,
      avg_rating: 4.9,
      review_count: 530
    },
    {
      name: "Nagarjuna Andhra Meals",
      category: 'restaurants',
      description: "Unmatched traditional spicy Andhra Bhojanam served on freshly cut banana leaves. Famous for Chicken Sholay Kebab, Mutton Biryani, and Gongura chutney.",
      phone: '+91 80 4112 0000',
      whatsapp: '+91 98333 41120',
      email: 'contact@nagarjunarestaurants.com',
      website: 'https://nagarjunarestaurants.com',
      address: '44/1 Residency Road, Near Galaxy Theatre',
      area: 'Residency Road',
      city: 'Bengaluru',
      pincode: '560025',
      lat: 12.9719,
      lng: 77.6070,
      image_url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('11:30', '23:00'),
      is_verified: 1,
      avg_rating: 4.7,
      review_count: 310
    },

    // --- HYDERABAD RESTAURANTS ---
    {
      name: "Paradise Biryani Secunderabad",
      category: 'restaurants',
      description: "World's most famous Hyderabadi Dum Biryani since 1953. Slow-cooked marinated mutton and fragrant long-grain basmati with zafran, served with Mirchi Ka Salan and Raita.",
      phone: '+91 40 6666 5555',
      whatsapp: '+91 98444 66665',
      email: 'biryani@paradisefoodcourt.in',
      website: 'https://paradisefoodcourt.in',
      address: 'Sappu Bagh Commercial Complex, SD Road, Secunderabad',
      area: 'Secunderabad',
      city: 'Hyderabad',
      pincode: '500003',
      lat: 17.4411,
      lng: 78.4983,
      image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('11:00', '23:30'),
      is_verified: 1,
      avg_rating: 4.8,
      review_count: 620
    },
    {
      name: "Bawarchi Restaurant RTC X Roads",
      category: 'restaurants',
      description: "Original Bawarchi at RTC X Roads is a legendary Hyderabadi landmark. Renowned for authentic Mutton Biryani, Boti Kebab, and rich seasonal Zafrani Haleem.",
      phone: '+91 40 2760 1199',
      whatsapp: '+91 98444 27601',
      email: 'original@bawarchibiryani.in',
      website: 'https://bawarchibiryani.in',
      address: 'Beside Sandhya Theatre, RTC Cross Road, Chikkadpally',
      area: 'Chikkadpally',
      city: 'Hyderabad',
      pincode: '500020',
      lat: 17.4042,
      lng: 78.4984,
      image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('11:30', '23:45'),
      is_verified: 1,
      avg_rating: 4.7,
      review_count: 450
    },
    {
      name: "Hotel Shadab Charminar",
      category: 'restaurants',
      description: "Heritage Old City Mughlai and Nizami cuisine restaurant near Charminar. Unrivaled for Mutton Biryani, Paya Nahari with Sheermal, and creamy Qubani Ka Meetha.",
      phone: '+91 40 2456 5949',
      whatsapp: '+91 98444 24565',
      email: 'shadabhotel@gmail.com',
      website: 'https://hotelshadab.com',
      address: '21 High Court Road, Madina Circle, Charminar',
      area: 'Charminar',
      city: 'Hyderabad',
      pincode: '500002',
      lat: 17.3687,
      lng: 78.4736,
      image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('05:30', '01:00'),
      is_verified: 1,
      avg_rating: 4.8,
      review_count: 380
    },

    // --- KOLKATA RESTAURANTS ---
    {
      name: "Peter Cat Park Street",
      category: 'restaurants',
      description: "Park Street's crown jewel since 1975. The sacred home of the world-famous Chelo Kebab served with butter rice and poached egg, alongside sizzling platters.",
      phone: '+91 33 2229 8841',
      whatsapp: '+91 98555 22298',
      email: 'chelokebab@petercatkolkata.com',
      website: 'https://petercatkolkata.com',
      address: '18A Park Street, Park Street Area',
      area: 'Park Street',
      city: 'Kolkata',
      pincode: '700071',
      lat: 22.5535,
      lng: 88.3524,
      image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('12:00', '23:30'),
      is_verified: 1,
      avg_rating: 4.9,
      review_count: 510
    },
    {
      name: "Flurys Heritage Tearoom",
      category: 'restaurants',
      description: "Iconic European tea-room operating on Park Street since 1927. Renowned for full English Breakfast, Rum Balls, Baba au Rhum, Strawberry tarts, and Darjeeling tea.",
      phone: '+91 33 4000 7453',
      whatsapp: '+91 98555 40007',
      email: 'flurys@theparkhotels.com',
      website: 'https://flurys.com',
      address: '18 Park Street, Park Street Area',
      area: 'Park Street',
      city: 'Kolkata',
      pincode: '700071',
      lat: 22.5539,
      lng: 88.3521,
      image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('07:30', '22:30'),
      is_verified: 1,
      avg_rating: 4.8,
      review_count: 430
    },
    {
      name: "Arsalan Mughlai Park Circus",
      category: 'restaurants',
      description: "The gold standard of Kolkata Mutton Biryani with tender aromatic potato, boiled egg, Mutton Chaap, Chicken Rezala, and soft Firni.",
      phone: '+91 33 2289 4444',
      whatsapp: '+91 98555 22894',
      email: 'arsalan.kolkata@gmail.com',
      website: 'https://arsalan.in',
      address: '191 Marina Park Circus 7-Point Crossing',
      area: 'Park Circus',
      city: 'Kolkata',
      pincode: '700017',
      lat: 22.5447,
      lng: 88.3664,
      image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('11:00', '23:45'),
      is_verified: 1,
      avg_rating: 4.7,
      review_count: 395
    },

    // --- CHENNAI RESTAURANTS ---
    {
      name: "Murugan Idli Shop T. Nagar",
      category: 'restaurants',
      description: "Chennai's favorite stop for pillow-soft hot Mallipoo Idlis smothered in spicy Ghee Podi, crunchy Medu Vadas, and four legendary free-flowing fresh coconut and tomato chutneys.",
      phone: '+91 44 2434 4445',
      whatsapp: '+91 98444 24344',
      email: 'care@muruganidlishop.com',
      website: 'https://muruganidlishop.com',
      address: '77/1 GN Chetty Road, T. Nagar',
      area: 'T. Nagar',
      city: 'Chennai',
      pincode: '600017',
      lat: 13.0418,
      lng: 80.2341,
      image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('07:00', '23:00'),
      is_verified: 1,
      avg_rating: 4.8,
      review_count: 420
    },
    {
      name: "Dindigul Thalappakatti Anna Salai",
      category: 'restaurants',
      description: "Authentic Dindigul biryani cooked with traditional Seeraga Samba short-grain rice, succulent farm meat, and secret mountain spices since 1957.",
      phone: '+91 44 4858 8888',
      whatsapp: '+91 98444 48588',
      email: 'chennai@thalappakatti.com',
      website: 'https://thalappakatti.com',
      address: '497 Anna Salai, Thousand Lights',
      area: 'Thousand Lights',
      city: 'Chennai',
      pincode: '600006',
      lat: 13.0569,
      lng: 80.2524,
      image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('11:00', '23:00'),
      is_verified: 1,
      avg_rating: 4.6,
      review_count: 310
    },

    // --- JAIPUR RESTAURANTS ---
    {
      name: "LMB - Laxmi Misthan Bhandar",
      category: 'restaurants',
      description: "Jaipur's royal culinary heritage in Johari Bazaar since 1727. Famous for melt-in-mouth Paneer Ghewar, Pyaaz Kachori, Doodh Pheni, and authentic Royal Rajasthani Thali.",
      phone: '+91 141 256 5844',
      whatsapp: '+91 98290 25658',
      email: 'info@hotellmb.com',
      website: 'https://hotellmb.com',
      address: 'Johari Bazaar, Pink City',
      area: 'Pink City',
      city: 'Jaipur',
      pincode: '302003',
      lat: 26.9200,
      lng: 75.8270,
      image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('08:00', '23:00'),
      is_verified: 1,
      avg_rating: 4.8,
      review_count: 380
    },
    {
      name: "Handi Restaurant MI Road",
      category: 'restaurants',
      description: "Award-winning traditional North Indian and Rajasthani meat specialist on MI Road. Renowned for slow-cooked fiery Laal Maas, Handi Meat, and Badami Chicken.",
      phone: '+91 141 236 4839',
      whatsapp: '+91 98290 23648',
      email: 'handi.jaipur@gmail.com',
      website: 'https://handirestaurant.com',
      address: 'Maya Mansion, Opposite GPO, MI Road',
      area: 'MI Road',
      city: 'Jaipur',
      pincode: '302001',
      lat: 26.9185,
      lng: 75.8080,
      image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('12:00', '23:00'),
      is_verified: 1,
      avg_rating: 4.7,
      review_count: 260
    },

    // --- LUCKNOW RESTAURANTS ---
    {
      name: "Tunday Kababi Aminabad",
      category: 'restaurants',
      description: "World-famous 1905 Awadhi culinary legend founded by Haji Murad Ali. Renowned for melt-in-the-mouth 160-spice Galouti Kebabs and flaky Mughlai Ulte Tawe Ka Paratha.",
      phone: '+91 522 262 2786',
      whatsapp: '+91 98390 26227',
      email: 'info@tundaykababi.com',
      website: 'https://tundaykababi.com',
      address: '168/6 Naaz Cinema Road, Aminabad',
      area: 'Aminabad',
      city: 'Lucknow',
      pincode: '226018',
      lat: 26.8480,
      lng: 80.9250,
      image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('11:00', '23:30'),
      is_verified: 1,
      avg_rating: 4.9,
      review_count: 530
    },
    {
      name: "Dastarkhwan Hazratganj",
      category: 'restaurants',
      description: "Heart of Awadhi dining in Lucknow. Famous for succulent Chicken Masala, Boti Kebab, Mutton Rogan Josh, and royal Shahi Tukda with silver vark.",
      phone: '+91 522 400 0088',
      whatsapp: '+91 98390 40000',
      email: 'contact@dastarkhwanlucknow.com',
      website: 'https://dastarkhwanlucknow.com',
      address: '29 Tulsi Theatre Complex, Hazratganj',
      area: 'Hazratganj',
      city: 'Lucknow',
      pincode: '226001',
      lat: 26.8520,
      lng: 80.9410,
      image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('12:30', '23:00'),
      is_verified: 1,
      avg_rating: 4.8,
      review_count: 320
    },

    // --- GOA RESTAURANTS ---
    {
      name: "Britto's Beach Shack Baga",
      category: 'restaurants',
      description: "North Goa's most legendary beach shack at Baga Beach since 1965. Famous for butter garlic lobster, Goan prawn curry with poi, baked stuffed crabs, and seafood platters.",
      phone: '+91 832 227 7331',
      whatsapp: '+91 98221 27733',
      email: 'brittosbaga@gmail.com',
      website: 'https://brittosgoa.com',
      address: 'Baga Beach, Calangute, North Goa',
      area: 'Baga Beach',
      city: 'Goa',
      pincode: '403516',
      lat: 15.5553,
      lng: 73.7517,
      image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('08:30', '00:00'),
      is_verified: 1,
      avg_rating: 4.8,
      review_count: 480
    },
    {
      name: "The Fisherman's Wharf Panaji",
      category: 'restaurants',
      description: "Riverside fine dining celebrating coastal Goan gastronomy. Renowned for Kingfish Rava Fry, Prawn Balchão, Pork Vindaloo, and traditional seven-layered Bebinca.",
      phone: '+91 832 242 0000',
      whatsapp: '+91 98221 24200',
      email: 'panaji@thefishermanswharf.in',
      website: 'https://thefishermanswharf.in',
      address: 'Campal, Panaji, Central Goa',
      area: 'Panaji',
      city: 'Goa',
      pincode: '403001',
      lat: 15.4950,
      lng: 73.8180,
      image_url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('12:00', '23:30'),
      is_verified: 1,
      avg_rating: 4.7,
      review_count: 310
    },

    // --- PUNE RESTAURANTS ---
    {
      name: "Kayani Bakery & Cafe East Street",
      category: 'restaurants',
      description: "Pune's legendary 1955 Parsi bakery on East Street. People line up for its world-famous melt-in-the-mouth buttery Shrewsbury Biscuits, Mawa Cake, and Brazil Nut cookies.",
      phone: '+91 20 2613 2983',
      whatsapp: '+91 98220 26132',
      email: 'kayanibakerypune@gmail.com',
      website: 'https://kayanibakery.com',
      address: '6 East Street, Hulshur, Camp',
      area: 'Camp',
      city: 'Pune',
      pincode: '411001',
      lat: 18.5140,
      lng: 73.8790,
      image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('07:30', '19:00'),
      is_verified: 1,
      avg_rating: 4.9,
      review_count: 420
    },
    {
      name: "Vaishali Restaurant FC Road",
      category: 'restaurants',
      description: "Iconic Ferguson College Road hangout spot running since 1949. Famous for SPDP (Sev Potato Dahi Puri), Mysore Cheese Masala Dosa, and frothy South Indian Filter Coffee.",
      phone: '+91 20 2553 1244',
      whatsapp: '+91 98220 25531',
      email: 'vaishalipune@gmail.com',
      website: 'https://vaishalirestaurant.in',
      address: '1218/1 FC Road, Shivajinagar',
      area: 'FC Road',
      city: 'Pune',
      pincode: '411004',
      lat: 18.5235,
      lng: 73.8410,
      image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('07:00', '23:00'),
      is_verified: 1,
      avg_rating: 4.8,
      review_count: 360
    },

    // --- AHMEDABAD RESTAURANTS ---
    {
      name: "Agashiye - The House of MG",
      category: 'restaurants',
      description: "Celebrated heritage rooftop dining experience opposite Sidi Saiyyed Mosque. Served in gleaming bronze thalis, featuring authentic seasonal Gujarati rasoi and live warm rotlis.",
      phone: '+91 79 2550 6946',
      whatsapp: '+91 98250 25506',
      email: 'agashiye@houseofmg.com',
      website: 'https://houseofmg.com',
      address: 'The House of MG, Opp. Sidi Saiyyed Mosque, Lal Darwaja',
      area: 'Lal Darwaja',
      city: 'Ahmedabad',
      pincode: '380001',
      lat: 23.0270,
      lng: 72.5810,
      image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('12:00', '22:30'),
      is_verified: 1,
      avg_rating: 4.9,
      review_count: 310
    },

    // --- CHANDIGARH & AMRITSAR ---
    {
      name: "Kesar Da Dhaba Amritsar",
      category: 'restaurants',
      description: "Iconic 1916 pure vegetarian culinary monument near Golden Temple. Famous for slow-cooked Maa Ki Dal cooked for 12 hours with desi ghee, Lachha Paratha, and Firni.",
      phone: '+91 183 255 2103',
      whatsapp: '+91 98140 25521',
      email: 'kesardadhaba@gmail.com',
      website: 'https://kesardadhaba.com',
      address: 'Chowk Passian, Near Town Hall',
      area: 'Old City',
      city: 'Amritsar',
      pincode: '143001',
      lat: 31.6250,
      lng: 74.8770,
      image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('11:00', '23:00'),
      is_verified: 1,
      avg_rating: 4.8,
      review_count: 460
    },
    {
      name: "Pal Dhaba Chandigarh",
      category: 'restaurants',
      description: "Chandigarh's favorite robust Punjabi meat dhaba in Sector 28. Revered for Butter Chicken, Mutton Rogan Josh, Brain Curry, and crisp Tandoori Rotis.",
      phone: '+91 172 265 7596',
      whatsapp: '+91 98140 26575',
      email: 'paldhabachd@gmail.com',
      website: 'https://paldhaba.com',
      address: 'SCO 151-152, Sector 28 D',
      area: 'Sector 28',
      city: 'Chandigarh',
      pincode: '160028',
      lat: 30.7160,
      lng: 76.8040,
      image_url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('11:00', '23:30'),
      is_verified: 1,
      avg_rating: 4.7,
      review_count: 280
    },

    // --- POPULAR CHAINS & OTHER SECTORS ACROSS INDIA ---
    {
      name: "Jawed Habib Hair & Beauty Lounge",
      category: 'salons',
      description: "India's premier hairstyling and beauty salon chain offering modern hair cuts, keratin therapies, bridal makeovers, and luxury facials.",
      phone: '+91 11 4151 7777',
      whatsapp: '+91 98111 41517',
      email: 'care@jawedhabib.co.in',
      website: 'https://jawedhabib.co.in',
      address: 'M-Block Market, Greater Kailash 1',
      area: 'Greater Kailash',
      city: 'Delhi',
      pincode: '110048',
      lat: 28.5520,
      lng: 77.2380,
      image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('10:00', '21:00'),
      is_verified: 1,
      avg_rating: 4.7,
      review_count: 180
    },
    {
      name: "Enrich Salon Bandra West",
      category: 'salons',
      description: "Mumbai's trusted premium salon brand providing organic facials, Olaplex hair treatments, manicure, and precision styling.",
      phone: '+91 22 2640 1122',
      whatsapp: '+91 98222 26401',
      email: 'customercare@enrichsalon.com',
      website: 'https://enrichbeauty.com',
      address: 'Hill Road, Near Bandra Police Station, Bandra West',
      area: 'Bandra West',
      city: 'Mumbai',
      pincode: '400050',
      lat: 19.0550,
      lng: 72.8310,
      image_url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('09:30', '21:30'),
      is_verified: 1,
      avg_rating: 4.8,
      review_count: 220
    },
    {
      name: "Cult.fit Fitness Center",
      category: 'gyms',
      description: "India's leading fitness chain featuring trainer-led strength & conditioning, Boxing, HRX workouts, Yoga, and Dance Fitness with modern shower amenities.",
      phone: '+91 80 4567 8900',
      whatsapp: '+91 98333 45678',
      email: 'hello@curefit.com',
      website: 'https://cult.fit',
      address: '100 Feet Road, HAL 2nd Stage, Indiranagar',
      area: 'Indiranagar',
      city: 'Bengaluru',
      pincode: '560038',
      lat: 12.9730,
      lng: 77.6410,
      image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('06:00', '22:00'),
      is_verified: 1,
      avg_rating: 4.8,
      review_count: 310
    },
    {
      name: "Apollo Hospitals & Health City",
      category: 'hospitals',
      description: "Multi-speciality tertiary care hospital accredited by JCI. Renowned for 24x7 emergency response, cardiology, oncology, neurosurgery, and organ transplants.",
      phone: '+91 44 2829 0200',
      whatsapp: '+91 98444 28290',
      email: 'apollo.greams@apollohospitals.com',
      website: 'https://apollohospitals.com',
      address: '21 Greams Lane, Thousand Lights',
      area: 'Thousand Lights',
      city: 'Chennai',
      pincode: '600006',
      lat: 13.0600,
      lng: 80.2500,
      image_url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1666214280391-8ff5bd3c0bf0?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('00:00', '23:59'),
      is_verified: 1,
      avg_rating: 4.9,
      review_count: 520
    },
    {
      name: "Max Super Speciality Hospital Saket",
      category: 'hospitals',
      description: "Leading super speciality hospital in South Delhi with state-of-the-art Cath labs, robotic surgery suites, and premier oncology and orthopaedic centers.",
      phone: '+91 11 2651 5050',
      whatsapp: '+91 98111 26515',
      email: 'info@maxhealthcare.com',
      website: 'https://maxhealthcare.in',
      address: '1, 2 Press Enclave Road, Saket',
      area: 'Saket',
      city: 'Delhi',
      pincode: '110017',
      lat: 28.5280,
      lng: 77.2130,
      image_url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1666214280391-8ff5bd3c0bf0?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('00:00', '23:59'),
      is_verified: 1,
      avg_rating: 4.8,
      review_count: 440
    },
    {
      name: "Dr. Lal PathLabs Central Reference Lab",
      category: 'healthcare',
      description: "NABL-accredited diagnostic center offering 5,000+ pathological tests, full body health checkups, home sample collection, and fast digital reports.",
      phone: '+91 11 3988 5050',
      whatsapp: '+91 98111 39885',
      email: 'support@lalpathlabs.com',
      website: 'https://lalpathlabs.com',
      address: 'Block E, Sector 18',
      area: 'Sector 18',
      city: 'Noida',
      pincode: '201301',
      lat: 28.5710,
      lng: 77.3255,
      image_url: 'https://images.unsplash.com/photo-1666214280391-8ff5bd3c0bf0?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1666214280391-8ff5bd3c0bf0?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('07:00', '21:00'),
      is_verified: 1,
      avg_rating: 4.7,
      review_count: 290
    },
    {
      name: "Fabindia Home Experience Store",
      category: 'home-decor',
      description: "Handcrafted Indian artisanal furniture, organic cotton bed linens, ceramic tableware, handwoven dhurries, and brass decorative lighting.",
      phone: '+91 11 4151 5151',
      whatsapp: '+91 98111 41515',
      email: 'customercare@fabindia.net',
      website: 'https://fabindia.com',
      address: '14 N-Block Market, Greater Kailash 1',
      area: 'Greater Kailash',
      city: 'Delhi',
      pincode: '110048',
      lat: 28.5535,
      lng: 77.2390,
      image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('10:00', '20:30'),
      is_verified: 1,
      avg_rating: 4.8,
      review_count: 210
    },
    {
      name: "Urban Company Partner Hub",
      category: 'repairs',
      description: "On-demand doorstep AC repair, plumbing, electrical installations, carpenter services, and home deep cleaning with guaranteed 30-day warranty.",
      phone: '+91 124 456 7890',
      whatsapp: '+91 98111 45678',
      email: 'help@urbancompany.com',
      website: 'https://urbancompany.com',
      address: 'Udyog Vihar Phase 4',
      area: 'Udyog Vihar',
      city: 'Gurugram',
      pincode: '122015',
      lat: 28.5020,
      lng: 77.0810,
      image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1607472829760-2f8fdea72cb1?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('08:00', '21:00'),
      is_verified: 1,
      avg_rating: 4.8,
      review_count: 360
    },
    {
      name: "Agarwal Packers and Movers (DRS Group)",
      category: 'movers',
      description: "India's most trusted household goods shifting, car transportation, and commercial corporate relocation services across 1,200+ Indian destinations.",
      phone: '+91 11 4111 1111',
      whatsapp: '+91 98111 41111',
      email: 'support@agarwalpackers.in',
      website: 'https://agarwalpackers.in',
      address: 'Plot 24, Mohan Co-op Industrial Estate, Mathura Road',
      area: 'Mathura Road',
      city: 'Delhi',
      pincode: '110044',
      lat: 28.5140,
      lng: 77.2980,
      image_url: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('08:00', '22:00'),
      is_verified: 1,
      avg_rating: 4.6,
      review_count: 275
    },
    {
      name: "Heads Up For Tails (HUFT) Pet Care",
      category: 'pet-care',
      description: "India's favorite luxury pet store and pet spa. Premium dog foods, organic grooming shampoos, pet clothing, veterinary advice, and puppy play dates.",
      phone: '+91 11 4987 6543',
      whatsapp: '+91 98111 49876',
      email: 'woof@huft.com',
      website: 'https://headsupfortails.com',
      address: 'Shop 25, Khan Market Middle Lane',
      area: 'Khan Market',
      city: 'Delhi',
      pincode: '110003',
      lat: 28.6005,
      lng: 77.2270,
      image_url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('10:00', '21:00'),
      is_verified: 1,
      avg_rating: 4.9,
      review_count: 240
    },
    {
      name: "Allen Career Institute Koramangala",
      category: 'education',
      description: "India's premier coaching academy for JEE Advanced, NEET-UG, Olympiads, and Foundation courses with experienced national faculty and study libraries.",
      phone: '+91 80 4670 4000',
      whatsapp: '+91 98333 46704',
      email: 'bengaluru@allen.in',
      website: 'https://allen.in',
      address: '80 Feet Road, 7th Block, Koramangala',
      area: 'Koramangala',
      city: 'Bengaluru',
      pincode: '560095',
      lat: 12.9352,
      lng: 77.6180,
      image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('08:00', '20:00'),
      is_verified: 1,
      avg_rating: 4.8,
      review_count: 310
    },
    {
      name: "DLF Properties & Real Estate Studio",
      category: 'realestate',
      description: "Official advisory lounge for luxury residential apartments, Grade A corporate tech parks, and commercial retail shop leases across Delhi NCR.",
      phone: '+91 124 456 0000',
      whatsapp: '+91 98111 45600',
      email: 'customercare@dlf.in',
      website: 'https://dlf.in',
      address: 'DLF Cyber City, Building 10, DLF Phase 2',
      area: 'Cyber City',
      city: 'Gurugram',
      pincode: '122002',
      lat: 28.4900,
      lng: 77.0920,
      image_url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('09:30', '18:30'),
      is_verified: 1,
      avg_rating: 4.7,
      review_count: 190
    },
    {
      name: "Taj Palace Banquets & Events",
      category: 'events',
      description: "Ultra-luxury wedding ballrooms, international summit convention halls, and outdoor poolside lawn setups with bespoke royal catering.",
      phone: '+91 11 2611 0202',
      whatsapp: '+91 98111 26110',
      email: 'palace.delhi@tajhotels.com',
      website: 'https://tajhotels.com',
      address: '2 Sardar Patel Marg, Diplomatic Enclave',
      area: 'Chanakyapuri',
      city: 'Delhi',
      pincode: '110021',
      lat: 28.5990,
      lng: 77.1750,
      image_url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=600&fit=crop',
      gallery_json: makeGallery(
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop'
      ),
      opening_hours_json: standardHours('08:00', '23:59'),
      is_verified: 1,
      avg_rating: 4.9,
      review_count: 280
    }
  ];

  const insertBusiness = db.prepare(`
    INSERT INTO businesses (
      owner_id, name, category_id, description, phone, whatsapp, email, website,
      address, area, city, pincode, lat, lng, image_url, gallery_json, opening_hours_json,
      is_verified, status, avg_rating, review_count, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, datetime('now', ?)
    )
  `);

  let bizCount = 0;
  for (const b of realBusinesses) {
    bizCount++;
    const catId = catMap[b.category] || catMap['restaurants'];
    const ownerId = bizCount % 2 === 0 ? owner1Id : owner2Id;

    insertBusiness.run(
      ownerId,
      b.name,
      catId,
      b.description,
      b.phone,
      b.whatsapp,
      b.email,
      b.website,
      b.address,
      b.area,
      b.city,
      b.pincode,
      b.lat,
      b.lng,
      b.image_url,
      b.gallery_json,
      b.opening_hours_json,
      b.is_verified,
      'approved',
      b.avg_rating,
      b.review_count,
      `-${Math.floor(Math.random() * 20 + 2)} days`
    );
  }

  // 4. Seed Reviews, Leads, and Messages for initial vibrancy
  console.log('⭐ Seeding customer feedback and analytics...');
  const allBiz = db.prepare('SELECT id, name FROM businesses').all();

  const insertReview = db.prepare(`
    INSERT INTO reviews (business_id, user_id, rating, comment, created_at)
    VALUES (?, ?, ?, ?, datetime('now', ?))
  `);

  const reviewComments = [
    'Outstanding authentic food and courteous staff! One of the best meals in India.',
    'Crispy and delicious. The flavors are legendary and unforgettable.',
    'Prompt service, clean ambiance, and incredible regional recipes.',
    'Always a joy visiting this place whenever we are in town. Highly recommended!',
    'Five stars for quality, taste, and hospitality!'
  ];

  for (let i = 0; i < Math.min(allBiz.length, 30); i++) {
    const biz = allBiz[i];
    const uId = (i % 3 === 0) ? user1Id : (i % 3 === 1) ? user2Id : user3Id;
    const rating = (i % 5 === 0) ? 4 : 5;
    const comment = reviewComments[i % reviewComments.length];
    try {
      insertReview.run(biz.id, uId, rating, comment, `-${i} days`);
    } catch (e) {
      // ignore unique constraint
    }
  }

  // Leads
  const insertLead = db.prepare(`
    INSERT INTO leads (business_id, user_id, type, created_at)
    VALUES (?, ?, ?, datetime('now', ?))
  `);

  const leadTypes = ['view', 'call', 'whatsapp', 'directions', 'message'];
  for (let i = 0; i < allBiz.length; i++) {
    const biz = allBiz[i];
    for (let j = 0; j < 6; j++) {
      const type = leadTypes[j % leadTypes.length];
      const daysAgo = `-${Math.floor(Math.random() * 7)} days`;
      insertLead.run(biz.id, user1Id, type, daysAgo);
    }
  }

  // Enquiries
  const insertMsg = db.prepare(`
    INSERT INTO messages (business_id, user_id, name, phone, email, body, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  insertMsg.run(1, user1Id, 'Aarav Sharma', '+91 98765 43210', 'aarav@example.com', 'Do you take table reservations for 8 people this Saturday evening?', 'new', '-1 days');
  insertMsg.run(1, user2Id, 'Kavita Roy', '+91 98444 55667', 'kavita@example.com', 'Are family celebration thali packages available?', 'read', '-3 days');
  insertMsg.run(2, user3Id, 'Deepak Rao', '+91 98555 66778', 'deepak@example.com', 'Can you deliver bulk food packages for office lunch?', 'new', '-2 days');

  // Favourites
  const insertFav = db.prepare('INSERT OR IGNORE INTO favourites (user_id, business_id) VALUES (?, ?)');
  insertFav.run(user1Id, 1);
  insertFav.run(user1Id, 2);
  insertFav.run(user1Id, 3);
  insertFav.run(user1Id, 9);
  insertFav.run(user1Id, 14);

  console.log(`✅ Seeding complete! Seeded ${allBiz.length} real businesses across India with reviews, leads, and favourites.`);
}

seedRealStores().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
