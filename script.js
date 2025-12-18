const fileInput = document.getElementById('file-input');
const uploadArea = document.getElementById('upload-area');
const previewArea = document.getElementById('preview-area');
const jsonPreview = document.getElementById('json-preview');
const keyListContainer = document.getElementById('key-list');
const resultArea = document.getElementById('result-area');

let jsonData = [];

// ファイル読み込み処理
fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const text = event.target.result;
            jsonData = JSON.parse(text);
            if (!Array.isArray(jsonData)) jsonData = [jsonData];
            uploadArea.style.display = 'none';
            previewArea.style.display = 'flex';
            jsonPreview.textContent = JSON.stringify(jsonData, null, 2);
            generateKeyList(jsonData);
        } catch (error) {
            alert("JSON読み込みエラー: " + error);
        }
    };
    reader.readAsText(file);
});

// キー一覧生成
function generateKeyList(data) {
    keyListContainer.innerHTML = '';
    if (data.length === 0) {
        keyListContainer.innerHTML = '<li>データが空です</li>';
        return;
    }
    const keys = Object.keys(data[0]);
    keys.forEach(key => {
        const li = document.createElement('li');
        li.className = 'key-item';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'key-name';
        nameSpan.textContent = key;
        const btn = document.createElement('button');
        btn.className = 'check-btn';
        btn.textContent = '選択';
        btn.onclick = () => checkDuplicate(key, btn);
        li.appendChild(nameSpan);
        li.appendChild(btn);
        keyListContainer.appendChild(li);
    });
}

/**
 * 規則
 * 1. 全角英数字 -> 半角 (NFKC)
 * 2. 各種ハイフン -> 半角ハイフン (-)
 * 3. 空白(スペース,タブ等) -> 削除
 * 4. 大文字 -> 小文字
 */
function normalizeString(str) {
    if (typeof str !== 'string') return String(str);
    
    return str
        .normalize('NFKC') // 全角統一
        .replace(/[\u2010-\u2015\u2212\u30FC\uFF0D]/g, '-') // ハイフン統一
        .replace(/\s+/g, '') // 空白削除 (スペース、タブ、改行すべて)
        .toLowerCase(); // 小文字化
}

// 重複チェック実行
function checkDuplicate(key, clickedBtn) {
    document.querySelectorAll('.check-btn').forEach(b => b.classList.remove('active'));
    clickedBtn.classList.add('active');

    const groupingMap = {};
    
    jsonData.forEach(item => {
        const originalVal = item[key];
        // オブジェクトの場合はJSON文字列化、null/undefined対応
        const originalValStr = (originalVal === null || originalVal === undefined) ? "" :
                                (typeof originalVal === 'object') ? JSON.stringify(originalVal) : String(originalVal);
        
        // 正規化 (ここでルールを適用)
        const normalizedVal = normalizeString(originalValStr);

        if (!groupingMap[normalizedVal]) {
            groupingMap[normalizedVal] = [];
        }
        groupingMap[normalizedVal].push(originalValStr);
    });

    // 重複のみ抽出
    const duplicates = Object.keys(groupingMap).filter(normKey => groupingMap[normKey].length > 1);

    displayResult(key, duplicates, groupingMap);
}

// 結果表示
function displayResult(key, duplicates, groupingMap) {
    let html = `<div><strong>選択項目:</strong> ${key}</div>`;
    html += `<div class="logic-desc">
                <strong>判定ルール:</strong><br>
                1. 全角を半角に変換 (１→1)<br>
                2. ハイフン類を統一 (ー, − → -)<br>
                3. 空白を削除 (A 1 → A1)<br>
                4. アルファベットは小文字扱い (A → a)
                </div>`;

    if (duplicates.length > 0) {
        html += `<div><strong>重複グループ:</strong> ${duplicates.length} 組</div><hr>`;
        
        duplicates.forEach(normKey => {
            const originalValues = groupingMap[normKey];
            // データ内の出現頻度を計算して見やすくする
            const detailCounts = {};
            originalValues.forEach(val => { detailCounts[val] = (detailCounts[val] || 0) + 1; });

            html += `<div class="duplicate-group">`;
            html += `<div class="duplicate-title">判定キー: "${normKey}"</div>`;
            html += `<ul class="original-values">`;
            
            // 内訳を表示
            for (const [val, count] of Object.entries(detailCounts)) {
                html += `<li>元の値: "<strong>${val}</strong>" (${count}件)</li>`;
            }
            
            html += `</ul></div>`;
        });
    } else {
        html += `<div class="no-duplicate">重複データは見つかりませんでした</div>`;
    }

    resultArea.innerHTML = html;
}