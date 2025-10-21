
// OTP-only login script
let otpTimer;

function startOTPTimer() {
    let timeLeft = 300; // 5 minutes
    const timerDisplay = document.getElementById('otp-timer');
    const resendBtn = document.getElementById('resend-btn');

    clearInterval(otpTimer);
    if (resendBtn) resendBtn.disabled = true;

    otpTimer = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        if (timerDisplay) timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        if (timeLeft <= 0) {
            clearInterval(otpTimer);
            if (resendBtn) resendBtn.disabled = false;
            if (timerDisplay) timerDisplay.textContent = '';
        }
        timeLeft--;
    }, 1000);
}

async function sendOTP() {
    const mobileInput = document.getElementById('mobile');
    if (!mobileInput) return alert('Mobile input not found');
    const mobile = mobileInput.value.trim();

    if (!/^\+91[1-9]\d{9}$/.test(mobile)) {
        return alert('Please enter a valid Indian mobile number with +91 prefix');
    }

    try {
        const res = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile }),
            credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok) return alert(data.error || 'Failed to send OTP');

        // show OTP form
        const mobileForm = document.getElementById('mobile-form');
        const otpForm = document.getElementById('otp-form');
        if (mobileForm) mobileForm.style.display = 'none';
        if (otpForm) otpForm.style.display = 'block';
        startOTPTimer();
    } catch (err) {
        console.error(err);
        alert('Failed to send OTP. Please try again.');
    }
}

async function verifyOTP() {
    const mobile = document.getElementById('mobile')?.value.trim();
    const otp = document.getElementById('otp')?.value.trim();
    if (!mobile || !otp) return alert('Please enter mobile and OTP');

    try {
        const res = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile, otp }),
            credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok) return alert(data.error || 'Invalid OTP');

        // show profile form
        document.getElementById('otp-form').style.display = 'none';
        const profileForm = document.getElementById('profile-form');
        if (profileForm) profileForm.style.display = 'block';
        clearInterval(otpTimer);
    } catch (err) {
        console.error(err);
        alert('Failed to verify OTP. Please try again.');
    }
}

async function updateProfile() {
    const name = document.getElementById('name')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    if (!name) return alert('Please enter your name');

    try {
        const res = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email }),
            credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok) return alert(data.error || 'Failed to update profile');
        window.location.href = '/mainpage.html';
    } catch (err) {
        console.error(err);
        alert('Failed to update profile. Please try again.');
    }
}

