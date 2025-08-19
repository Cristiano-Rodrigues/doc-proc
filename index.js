import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import fetch from 'node-fetch';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import apiKey from './setup/api/apiKey.json' with { type: 'json' };
import prompt from './setup/api/prompt.json' with { type: 'json' };

const app = express();
const PORT = 3000;
const UPLOAD_DIR = './upload';
const METADATA_FILE = './metadata/output.json';
const TOKEN_LIMIT = 4000;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = uuidv4() + ext;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());

let metadataStore = [];
if (fs.existsSync(METADATA_FILE)) {
  metadataStore = JSON.parse(fs.readFileSync(METADATA_FILE));
}

function similarity(a, b) {
  const wordsA = new Set(a.split(/\W+/));
  const wordsB = new Set(b.split(/\W+/));
  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
  return intersection.size / Math.max(wordsA.size, wordsB.size);
}

function parsePDFDate(dateString) {
  if (!dateString || !dateString.startsWith('D:')) return null;
  const [y, m, d, h, min, s] = [
    dateString.slice(2, 6),
    dateString.slice(6, 8),
    dateString.slice(8, 10),
    dateString.slice(10, 12) || '00',
    dateString.slice(12, 14) || '00',
    dateString.slice(14, 16) || '00'
  ];
  return `${y}-${m}-${d}T${h}:${min}:${s}Z`;
}

function sanitizeText(rawText) {
  return rawText
    .replace(/\s+/g, ' ')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .trim();
}

async function classify(text) {
  const content = prompt.value.replace('{}', text);
  const resposta = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.value}`,
    },
    body: JSON.stringify({
      model: "qwen/qwen3-coder:free",
      messages: [{ role: 'user', content }],
    })
  });

  const resultado = await resposta.json();
  try {
    return JSON.parse(resultado?.choices[0]?.message?.content ?? '{}');
  } catch {
    return null;
  }
}

app.post('/analisar', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);
    const { text, info, numpages } = await pdfParse(buffer);

    const sanitized = sanitizeText(text);

    const similarities = metadataStore.map(meta => ({
      filename: meta.originalname,
      score: similarity(meta.fulltext || '', sanitized)
    })).sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => ({ document: s.filename, similarity: (s.score * 100).toFixed(2) + '%' }));

    const aiData = await classify(sanitized.slice(TOKEN_LIMIT));
    if (!aiData) {
      return res.status(500).json({
        error: 'AI_INTERPRETATION_ERROR',
        message: 'Erro ao interpretar os dados do documento.'
      });
    }

    const docData = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      title: aiData.titulo,
      author: aiData.autor ?? info.Author ?? null,
      createdAt: parsePDFDate(info.CreationDate),
      modifiedAt: parsePDFDate(info.ModDate),
      pages: numpages,
      type: aiData.tipo,
      issuing_body: aiData.orgao_emissor,
      summary: aiData.resumo_breve,
      fulltext: sanitized,
      size: req.file.size / 1024,
      language: aiData.lingua,
      tags: aiData.tags
    };

    metadataStore.push(docData);
    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadataStore, null, 2));

    res.json({
      metadata: docData,
      similarities
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Erro interno ao processar documento.'
    });
  }
});

app.get('/buscar', (req, res) => {
  const query = (req.query.q ?? '').toLowerCase()
  const result = metadataStore.filter(meta => {
    return Object.values(meta).some(val =>
      typeof val === 'string' && val.toLowerCase().includes(query)
    );
  });
  res.json(result);
});

app.get('/metadados', (req, res) => {
  res.json(metadataStore);
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
