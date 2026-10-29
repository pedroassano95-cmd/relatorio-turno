# Relatório de Turno — versão para iPhone

## O que está incluído
- Formulário baseado no modelo de relatório enviado.
- Seleção dos turnos A, B e C e passagem automática A → B → C → A.
- Cálculo do total dos estoques (confira a escala/unidade usada pela empresa).
- Geração do relatório com formatação do WhatsApp.
- Cópia do texto e menu de compartilhamento do iPhone.
- Salvamento automático do rascunho e histórico local.
- Exportação/importação de backup JSON.
- Cache para uso offline depois da primeira instalação/carregamento.

## Como testar no computador
Abra `index.html` num navegador para conferir o layout e o gerador. O modo offline/PWA e o Service Worker exigem hospedagem HTTPS ou servidor local; abrir diretamente como `file://` não ativa todos os recursos.

## Como disponibilizar para iPhone
1. Publique os arquivos deste pacote em uma hospedagem estática que forneça HTTPS (por exemplo, GitHub Pages ou outro host estático).
2. Abra o endereço HTTPS no Safari do iPhone com internet.
3. Aguarde a página carregar completamente pelo menos uma vez.
4. No Safari, toque em Compartilhar → Adicionar à Tela de Início.
5. Abra pelo ícone e teste com internet antes de depender do modo offline.

## Importante
- Este pacote ainda precisa ser hospedado em HTTPS para instalar como PWA no iPhone. O arquivo ZIP sozinho não instala o app.
- Os dados ficam no armazenamento local do Safari/Web App deste aparelho; não sincronizam com os aparelhos dos colegas.
- Não limpe os dados do site/navegador sem antes exportar um backup.
- O envio ao WhatsApp não é automático; o app gera/copia o texto e o usuário confirma o envio.
- Verifique a escala dos estoques DA01/DA02: o app soma os números informados interpretando ponto como milhar quando há vírgula decimal. Confirme com o padrão operacional da usina antes de usar em relatórios oficiais.
