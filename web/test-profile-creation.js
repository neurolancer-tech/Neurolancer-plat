// Test script to verify profile creation
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neurolancer-plat.onrender.com/api';

async function testProfileCreation() {
  console.log('Testing profile creation...');
  console.log('API URL:', API_URL);
  
  // Test data for freelancer profile
  const testData = {
    title: 'Test AI Engineer',
    bio: 'Test bio for AI engineer',
    hourly_rate: 50.00,
    skills: 'Python, Machine Learning, TensorFlow',
    experience_years: 5,
    portfolio_url: 'https://example.com/portfolio',
    github_url: 'https://github.com/testuser',
    linkedin_url: 'https://linkedin.com/in/testuser',
    availability: 'freelance'
  };
  
  try {
    const response = await fetch(`${API_URL}/profiles/freelancer/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In real usage, you'd need authentication headers
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('Success! Profile created:', data);
    } else {
      console.log('Error creating profile. Status:', response.status);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}

testProfileCreation();