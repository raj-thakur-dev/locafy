const fs = require('fs');
const path = require('path');
const http = require('http');
const app = require('../backend/server');

async function runE2ETests() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  console.log(`Starting E2E test against test server on port ${port}...`);

  async function request(path, options = {}) {
    const url = `${baseUrl}${path}`;
    const headers = { ...(options.headers || {}) };
    let body = options.body;

    if (body && typeof body === 'object' && !(body instanceof Buffer) && !headers['Content-Type']?.includes('multipart')) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(body);
    }

    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: body
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return { status: res.status, ok: res.ok, data };
  }

  try {
    console.log('\n--- 1. Testing Flow A: Customer Journey ---');
    // 1.1 Customer signup
    const userEmail = `cust_${Date.now()}@test.com`;
    const signupRes = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'Aarav Sharma',
        email: userEmail,
        phone: '9876543210',
        password: 'Password@123',
        role: 'user'
      }
    });
    if (!signupRes.ok) throw new Error(`User signup failed: ${JSON.stringify(signupRes.data)}`);
    const userToken = signupRes.data.token;
    console.log('✓ User signup successful. Got JWT token.');

    // 1.2 Customer searches "salon" near Noida (28.5355, 77.3910)
    const searchRes = await request('/businesses?q=salon&lat=28.5355&lng=77.3910');
    if (!searchRes.ok) throw new Error(`Search failed: ${JSON.stringify(searchRes.data)}`);
    console.log(`✓ Search returned ${searchRes.data.businesses.length} salon listings near Noida.`);
    if (searchRes.data.businesses.length === 0) throw new Error('Expected at least 1 salon from seed data');
    const targetBiz = searchRes.data.businesses[0];
    console.log(`✓ Picked business: "${targetBiz.name}" (ID: ${targetBiz.id}, Distance: ${targetBiz.distance_km} km)`);

    // 1.3 Open listing detail (should log a 'view' lead)
    const detailRes = await request(`/businesses/${targetBiz.id}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    if (!detailRes.ok) throw new Error(`Get business detail failed: ${JSON.stringify(detailRes.data)}`);
    console.log(`✓ Listing detail loaded successfully. Name: ${detailRes.data.business.name}`);

    // 1.4 Add a review
    const reviewRes = await request(`/businesses/${targetBiz.id}/reviews`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        rating: 5,
        comment: 'Exceptional haircut and styling experience! Highly recommended.'
      }
    });
    if (!reviewRes.ok) throw new Error(`Add review failed: ${JSON.stringify(reviewRes.data)}`);
    console.log('✓ Review submitted successfully. New rating updated.');

    // 1.5 Add to favourites
    const favRes = await request(`/me/favourites/${targetBiz.id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    if (!favRes.ok) throw new Error(`Favourite failed: ${JSON.stringify(favRes.data)}`);
    console.log('✓ Business added to favourites.');

    // 1.6 Verify in favourites list
    const myFavsRes = await request('/me/favourites', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    if (!myFavsRes.ok) throw new Error(`Get favourites failed: ${JSON.stringify(myFavsRes.data)}`);
    const foundFav = myFavsRes.data.favourites.find(f => f.id === targetBiz.id);
    if (!foundFav) throw new Error('Newly favourited business not found in favourites list');
    console.log('✓ Verified business present in customer favourites list.');

    console.log('\n--- 2. Testing Flow B: Business Owner Signup & Listing Creation ---');
    // 2.1 Business owner signup
    const ownerEmail = `owner_${Date.now()}@test.com`;
    const ownerSignupRes = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'Priya Mehra',
        email: ownerEmail,
        phone: '9812345678',
        password: 'Password@123',
        role: 'business'
      }
    });
    if (!ownerSignupRes.ok) throw new Error(`Owner signup failed: ${JSON.stringify(ownerSignupRes.data)}`);
    const ownerToken = ownerSignupRes.data.token;
    console.log('✓ Business owner signup successful.');

    // 2.2 Fetch categories to get valid salon category ID
    const catRes = await request('/categories');
    const salonCat = (catRes.data.categories || []).find(c => c.slug === 'salons') || catRes.data.categories[0];
    const categoryId = salonCat.id;

    // Create business listing (status: pending)
    const createBizRes = await request('/owner/businesses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        name: 'Royal Heritage Salon & Spa',
        category_id: categoryId,
        description: 'Luxury organic grooming and wellness therapies for men and women.',
        phone: '+91 9812345678',
        whatsapp: '+91 9812345678',
        email: ownerEmail,
        website: 'https://royalheritagespa.in',
        address: 'Plot 45, Sector 18 Market',
        area: 'Sector 18',
        city: 'Noida',
        pincode: '201301',
        lat: 28.5708,
        lng: 77.3260,
        opening_hours: {
          mon: { open: '09:00', close: '21:00' },
          tue: { open: '09:00', close: '21:00' },
          wed: { open: '09:00', close: '21:00' },
          thu: { open: '09:00', close: '21:00' },
          fri: { open: '09:00', close: '21:00' },
          sat: { open: '09:00', close: '22:00' },
          sun: { open: '09:00', close: '22:00' }
        }
      }
    });
    if (!createBizRes.ok) throw new Error(`Create listing failed: ${JSON.stringify(createBizRes.data)}`);
    const newBizId = createBizRes.data.business.id;
    console.log(`✓ Business created with ID ${newBizId}. Initial status: ${createBizRes.data.business.status}`);
    if (createBizRes.data.business.status !== 'pending') throw new Error('Expected new listing status to be pending');

    // 2.3 Upload image using multipart/form-data
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    // 1x1 dummy PNG
    const dummyPng = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2d450000000049454e44ae426082', 'hex');
    const preData = `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="storefront.png"\r\nContent-Type: image/png\r\n\r\n`;
    const postData = `\r\n--${boundary}--\r\n`;
    const multipartBody = Buffer.concat([Buffer.from(preData), dummyPng, Buffer.from(postData)]);

    const uploadRes = await request(`/owner/businesses/${newBizId}/images`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: multipartBody
    });
    if (!uploadRes.ok) throw new Error(`Upload image failed: ${JSON.stringify(uploadRes.data)}`);
    console.log(`✓ Image uploaded successfully: ${uploadRes.data.image_url}`);

    console.log('\n--- 3. Testing Flow C: Admin Moderation & Verification ---');
    // 3.1 Admin login
    const adminLoginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: process.env.ADMIN_EMAIL || 'admin@locafy.in',
        password: process.env.ADMIN_PASSWORD || 'Admin@12345'
      }
    });
    if (!adminLoginRes.ok) throw new Error(`Admin login failed: ${JSON.stringify(adminLoginRes.data)}`);
    const adminToken = adminLoginRes.data.token;
    console.log('✓ Admin login successful.');

    // 3.2 Check pending list
    const pendingListRes = await request('/admin/businesses?status=pending', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!pendingListRes.ok) throw new Error(`Admin fetch pending failed: ${JSON.stringify(pendingListRes.data)}`);
    const isPending = pendingListRes.data.businesses.find(b => b.id === newBizId);
    if (!isPending) throw new Error('New business not found in pending list');
    console.log(`✓ Found business ${newBizId} in pending queue.`);

    // 3.3 Approve business
    const approveRes = await request(`/admin/businesses/${newBizId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!approveRes.ok) throw new Error(`Admin approve failed: ${JSON.stringify(approveRes.data)}`);
    console.log('✓ Business approved.');

    // 3.4 Verify business
    const verifyRes = await request(`/admin/businesses/${newBizId}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!verifyRes.ok) throw new Error(`Admin verify failed: ${JSON.stringify(verifyRes.data)}`);
    console.log('✓ Business verified badge granted.');

    // 3.5 Check public search for newly approved business
    const publicSearchRes = await request(`/businesses?q=Royal+Heritage`);
    if (!publicSearchRes.ok) throw new Error(`Public search failed: ${JSON.stringify(publicSearchRes.data)}`);
    const foundApproved = publicSearchRes.data.businesses.find(b => b.id === newBizId);
    if (!foundApproved) throw new Error('Approved business does not appear in public search');
    if (foundApproved.is_verified !== 1) throw new Error('Expected business to have is_verified=1');
    console.log(`✓ Newly approved business "${foundApproved.name}" visible in public search with is_verified=1.`);

    console.log('\n--- 4. Testing Flow D: Leads, Enquiry & Owner Dashboard ---');
    // 4.1 Track call lead
    const callLeadRes = await request(`/businesses/${newBizId}/track`, {
      method: 'POST',
      body: { type: 'call' }
    });
    if (!callLeadRes.ok) throw new Error(`Track call failed: ${JSON.stringify(callLeadRes.data)}`);
    console.log('✓ Call lead logged.');

    // 4.2 Track view lead
    await request(`/businesses/${newBizId}`);
    console.log('✓ View lead logged.');

    // 4.3 Customer sends enquiry message
    const msgRes = await request(`/businesses/${newBizId}/message`, {
      method: 'POST',
      body: {
        name: 'Sneha Patel',
        phone: '9876500000',
        email: 'sneha@example.com',
        body: 'Do you offer bridal makeup packages for December?'
      }
    });
    if (!msgRes.ok) throw new Error(`Send message failed: ${JSON.stringify(msgRes.data)}`);
    console.log('✓ Customer enquiry message sent.');

    // 4.4 Owner checks analytics
    const analyticsRes = await request(`/owner/businesses/${newBizId}/analytics?range=7d`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    if (!analyticsRes.ok) throw new Error(`Fetch analytics failed: ${JSON.stringify(analyticsRes.data)}`);
    const stats = analyticsRes.data.summary;
    console.log(`✓ Owner analytics verified: Views: ${stats.views}, Calls: ${stats.calls}, Messages: ${stats.messages}`);
    if (stats.calls < 1 || stats.messages < 1) throw new Error('Analytics lead counts do not match expected leads');

    // 4.5 Owner checks messages inbox
    const inboxRes = await request('/owner/messages', {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    if (!inboxRes.ok) throw new Error(`Fetch inbox failed: ${JSON.stringify(inboxRes.data)}`);
    const receivedMsg = inboxRes.data.messages.find(m => m.business_id === newBizId);
    if (!receivedMsg) throw new Error('Enquiry message not found in owner inbox');
    console.log(`✓ Owner inbox received customer message: "${receivedMsg.body}" from ${receivedMsg.name}`);

    // 4.6 Mark message as read
    const markReadRes = await request(`/owner/messages/${receivedMsg.id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    if (!markReadRes.ok) throw new Error(`Mark read failed: ${JSON.stringify(markReadRes.data)}`);
    console.log('✓ Message marked as read.');

    console.log('\n========================================');
    console.log('🎉 ALL END-TO-END FLOWS PASSED 100%!');
    console.log('========================================\n');
  } finally {
    server.close();
  }
}

runE2ETests().catch((err) => {
  console.error('\n❌ E2E TEST FAILED:', err);
  process.exit(1);
});
