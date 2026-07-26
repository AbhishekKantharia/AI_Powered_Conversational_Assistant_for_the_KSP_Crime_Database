const catalyst = require('zcatalyst-sdk-node');
const { OpenAI } = require('openai');

module.exports = async (req, res) => {
  const app = catalyst.initialize(req);

  try {
    const { prompt } = req.body;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are CrimeAssist AI for Karnataka State Police.' },
        { role: 'user', content: prompt }
      ]
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'success',
      answer: response.choices[0].message.content
    }));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'error', message: error.message }));
  }
};
