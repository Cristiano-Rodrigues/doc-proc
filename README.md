# O que é

Um módulo para um software de gestão documental. O seu principal objetivo é categorizar documentos usando IA, mas também possui features tais como:

* Busca inteligente
* Análise similaridade
* Resumo inteligente
* É integrado com uma interface fácil de usar.

## Instruções de instalação:

### Setup da chave

1 - Baixe ou clone o projeto.

2 - vá a https://openrouter.ai/qwen/qwen3-coder:free e crie uma chave de API.

3 - Crie um arquivo apiKey.json em /setup/api/ com o seguinte formato:
```json
{
  "value": "<aqui-vai-a-chave>"
}
```

### Instalação das dependências e execução.

1 - Abra um terminal e vá até a raiz do projeto e execute ```npm install``` e depois ```npm run dev```.

2 - Abra outro terminal e vá até /frontend e também execute ```npm install``` e depois ```npm run dev```.

3 - Copie o link loggado no terminal e cole no navegador.

### OBS

A versão gratuita do modelo de AI usado neste módulo tem rate limit. Por causa disso, talvez tenha de submeter um documento mais do que uma vez até conseguir processar.