// DIAGNOSTIC: Check Frontend Revenue Data Flow
// Copy paste script ini ke browser console (F12) saat di halaman Create RFQ

// Step 1: Check if you're logged in as admin
console.log('=== STEP 1: Check Login Status ===');
const authData = JSON.parse(localStorage.getItem('sb-ewquycutqbtagjlokvyn-auth-token'));
console.log('Email:', authData?.user?.email);
console.log('User ID:', authData?.user?.id);

// Step 2: Check profile role
console.log('\n=== STEP 2: Check Profile Role ===');
// You need to manually check this in Supabase:
// SELECT email, role FROM profiles WHERE id = '<your-user-id>';
console.log('Run this in Supabase SQL Editor:');
console.log(`SELECT email, role FROM profiles WHERE id = '${authData?.user?.id}';`);

// Step 3: Intercept form submission
console.log('\n=== STEP 3: Monitoring Form Submission ===');
console.log('Fill the form with revenue and click Save.');
console.log('Watch for logs below...');

// Intercept fetch calls
const originalFetch = window.fetch;
window.fetch = async (...args) => {
    const [url, options] = args;

    if (url.includes('inquiries') && options?.method === 'POST') {
        console.log('\n🔍 INTERCEPTED INSERT:');
        console.log('URL:', url);
        console.log('Method:', options.method);

        try {
            const body = JSON.parse(options.body);
            console.log('Revenue in payload:', body.est_revenue);
            console.log('GP in payload:', body.est_gp);
            console.log('Full payload:', body);
        } catch (e) {
            console.log('Body:', options.body);
        }
    }

    const response = await originalFetch(...args);

    if (url.includes('inquiries') && options?.method === 'POST') {
        const clone = response.clone();
        const data = await clone.json();
        console.log('\n📥 RESPONSE FROM SERVER:');
        console.log('Revenue in response:', data[0]?.est_revenue || data?.est_revenue);
        console.log('GP in response:', data[0]?.est_gp || data?.est_gp);
        console.log('Full response:', data);
    }

    return response;
};

console.log('\n✅ Diagnostic script loaded!');
console.log('Now fill the form and click Save to see what happens.');
