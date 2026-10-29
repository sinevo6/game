// games.json からゲーム一覧を読み込んでボタンを画面に並べる
fetch('games.json')
    .then(response => response.json())
    .then(games => {
        const container = document.getElementById('game-list');
        container.innerHTML = '';

        games.forEach(game => {
            const card = document.createElement('div');
            card.className = 'game-card';

            card.innerHTML = `
                <div class="game-icon">${game.icon}</div>
                <div class="game-title">${game.title}</div>
                <div class="game-desc">${game.description}</div>
                <a href="${game.path}" class="btn-play">あそぶ！</a>
            `;

            container.appendChild(card);
        });
    })
    .catch(error => {
        console.error('ゲームリストの読み込みに失敗しました:', error);
    });
