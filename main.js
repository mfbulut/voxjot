import express from "express"

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'))

// OpenAI
import OpenAI from 'openai';

const openai = new OpenAI({
	apiKey: "anything",
	baseURL: "http://localhost:3040/v1",
});

app.post("/api/query", async (req, res) => {
  try {
    const data = req.body;

    if (!data.text) {
      res.status(400).json({ error: "Bad Request: Text is empty" });
      return;
    }
    
    const result = await openai.chat.completions.create({
      messages: [{ role: 'system', content: 'You will be provided with a text. Summarize the text and make it as short as possible.' }, { role: 'user', content: data.text }],
      model: 'gpt-3.5-turbo',
    });

    res.json(result.choices[0].message.content);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
