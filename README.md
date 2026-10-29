# Relatórios de Operação — atualização v3

## Novidades
- Tela inicial para escolher Relatório de Turno ou Relatório de 2 Horas.
- Cada modelo lembra separadamente os últimos valores preenchidos, apenas no aparelho e navegador em uso.
- Relatório de Turno: total de estoque sem casas decimais (ex.: 30.244.903 t).
- Relatório de 2 Horas: total sem casas decimais (ex.: 1.050.710.802 t).
- Data do Relatório de Turno atualizada ao abrir e ao voltar ao aplicativo.
- Histórico separado por modelo, backup JSON de ambos, e migração dos dados locais da versão anterior.
- Cache offline atualizado.

## Atualizar GitHub Pages
Envie os arquivos desta pasta para a RAIZ do repositório `relatorio-turno` no GitHub:
`index.html`, `app.js`, `sw.js`, `manifest.webmanifest`, `README.md`, `icon-192.png`, `icon-512.png`.
No GitHub: Add file > Upload files > arraste os arquivos > Commit changes.
Quando perguntar se deseja substituir arquivos de mesmo nome, confirme. Não envie a pasta ou o ZIP inteiro.
O endereço público continua o mesmo: https://pedroassano95-cmd.github.io/relatorio-turno/

## Importante
Os dados são salvos localmente por origem/navegador, sem contas ou sincronização.
Atualizar os arquivos no GitHub não apaga normalmente os dados locais, mas exporte um backup antes de atualizar.
Não apague os dados do Safari/app instalado, pois isso pode eliminar os relatórios locais.
Ao publicar a atualização, conecte o iPhone à internet, abra o app, feche e reabra para receber a nova versão.
No relatório de 2 horas, a entrada DA01 954.601 é interpretada como 954,601 t (exemplo do usuário); DA02 30.341,980 é interpretada como 30.341,980 t, com total exibido sem casas decimais. Valores com um único ponto e três dígitos após ele são tratados como decimais no relatório simples. Confira entradas ambíguas.
Confira a unidade e escala operacional antes de enviar.
