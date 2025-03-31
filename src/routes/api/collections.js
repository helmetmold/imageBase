import dotenv from 'dotenv';
dotenv.config();

console.log('this happens');

export async function get() {
  try {
    const apiKey = process.env.BUNNY_API_KEY;
    const response = await fetch('https://api.bunny.net/library/402442/collections', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch collections:', response.statusText);
      return {
        status: response.status,
        body: { error: response.statusText }
      };
    }

    const collections = await response.json();
    return {
      body: collections
    };
  } catch (error) {
    console.error('Error fetching collections:', error);
    return {
      status: 500,
      body: { error: 'Internal Server Error' }
    };
  }
}

