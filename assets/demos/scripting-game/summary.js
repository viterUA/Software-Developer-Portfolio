
/*https://ru.stackoverflow.com/questions/1273290/%D0%9F%D0%B5%D1%80%D0%B5%D0%B7%D0%B0%D0%BF%D0%B8%D1%81%D0%B0%D1%82%D1%8C-
%D0%B7%D0%BD%D0%B0%D1%87%D0%B5%D0%BD%D0%B8%D0%B5-%D0%B2-%D1%8F%D1%87%D0%B5%D0%B9%D0%BA%D0%B5-%D1%82%D0%B0%D0%B1%D0%BB%D0%B8%D1%86%D1%8B-html-%D1%87%D0%B5%D1%80%D0%B5%D0%B7-javascript*/

function createSummaryTable(gameResults) {
    // Получаем элемент <tbody> таблицы
    const tableBody = document.querySelector("#summaryTable tbody");

    // Очищаем таблицу перед добавлением данных
    tableBody.innerHTML = "";

    // Создаем строки для каждого результата
    gameResults.forEach((result, index) => {
        const row = document.createElement("tr");

        // Номер вопроса
        let cell = document.createElement("td");
        cell.textContent = index + 1;
        row.appendChild(cell);

        // Вопрос
        cell = document.createElement("td");
        cell.textContent = result.question;
        row.appendChild(cell);

        // Ответы
        cell = document.createElement("td");
        cell.textContent = result.answers.join(", ");
        row.appendChild(cell);

        // Ваш ответ
        cell = document.createElement("td");
        cell.textContent = result.selectedAnswer !== null 
            ? result.answers[result.selectedAnswer] 
            : "No Answer";
        row.appendChild(cell);

        // Правильный ответ
        cell = document.createElement("td");
        cell.textContent = result.answers[result.correctAnswer];
        cell.classList.add("correct"); // Подсвечиваем правильный ответ
        row.appendChild(cell);

        // Результат
        cell = document.createElement("td");
        cell.textContent = result.correctAnswer === result.selectedAnswer ? "Correct" : "Wrong";
        cell.classList.add(result.correctAnswer === result.selectedAnswer ? "correct" : "wrong");
        row.appendChild(cell);

        // Добавляем строку в таблицу
        tableBody.appendChild(row);
    });
}

// Загружаем данные из localStorage
function loadGameResults() {
    const resultString = localStorage.getItem("gameResults");
    if (!resultString) return [];

    // Парсим строку JSON в массив объектов
    return JSON.parse(resultString);
}

// Инициализация таблицы при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
    const gameResults = loadGameResults();
    if (gameResults.length > 0) {
        createSummaryTable(gameResults);
    }
});
