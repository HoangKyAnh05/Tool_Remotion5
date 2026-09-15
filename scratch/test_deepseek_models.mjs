async function testOpenRouterAndDeepSeek() {
  console.log('Testing OpenRouter free DeepSeek R1...');
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-or-v1-anon' // check if anon works
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1:free',
        messages: [{ role: 'user', content: 'hello' }]
      })
    });
    console.log('OpenRouter anon status:', res.status);
    const data = await res.json().catch(() => ({}));
    console.log('OpenRouter anon resp:', data);
  } catch (e) {
    console.error('OpenRouter error:', e);
  }
}

testOpenRouterAndDeepSeek();
