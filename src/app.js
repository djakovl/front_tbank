// ===== ДАННЫЕ И СОСТОЯНИЕ =====
const AppState = {
    params: {
        address: null,
        budget: null,
        wishes: null
    },
    offers: [], // Список необходимого 
    cart: [], // Корзина с карточками от бота
    chatProducts: [], // Товары, показанные в чате
    chatHistory: [],
    currentUser: null,
    nextOfferId: 1,
    nextProductId: 1,
    editingOfferId: null
};



// ===== УТИЛИТЫ =====
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

function saveToken(token) {
  localStorage.setItem('authToken', token);
}

// Получение токена из localStorage
function getToken() {
  return localStorage.getItem('authToken');
}

// Удаление токена (при выходе)
function removeToken() {
  localStorage.removeItem('authToken');
}

function formatTime() {
    const now = new Date();
    return now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// ===== ВАЛИДАЦИЯ ПАРОЛЯ =====
function validatePassword(password) {
    if (password.length < 8) {
        return 'Пароль должен содержать минимум 8 символов';
    }
    if (!/[A-Z]/.test(password)) {
        return 'Пароль должен содержать хотя бы одну заглавную букву';
    }
    if (!/[a-z]/.test(password)) {
        return 'Пароль должен содержать хотя бы одну строчную букву';
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return 'Пароль должен содержать хотя бы один специальный символ (!@#$%^&* и т.д.)';
    }
    return null;
}

// ===== ИНИЦИАЛИЗАЦИЯ ТАБОВ =====
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');

            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`tab-${tabName}`).classList.add('active');
        });
    });
}

// ===== ФУНКЦИИ ЧАТА =====
function addMessage(text, isUser = false, buttons = []) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : ''}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = isUser ? 'B' : 'b';

    const content = document.createElement('div');
    content.className = 'message-content';

    const text_el = document.createElement('div');
    text_el.className = 'message-text';
    text_el.textContent = text;

    const time_el = document.createElement('div');
    time_el.className = 'message-time';
    time_el.textContent = formatTime();

    content.appendChild(text_el);
    content.appendChild(time_el);

    if (buttons.length > 0) {
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'message-buttons';

        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = 'message-btn';
            button.textContent = btn.text;
            button.addEventListener('click', () => {
                handleButtonClick(btn.action, btn.value);
            });
            buttonsDiv.appendChild(button);
        });

        content.appendChild(buttonsDiv);
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    messagesContainer.appendChild(messageDiv);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    AppState.chatHistory.push({ text, isUser });
}

// Функция для добавления карточки товара в чат
function addProductCardToChat(product) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;

    // Добавляем в массив товаров чата
    if (!product.countOfProduct) {
        product.countOfProduct = 1;
    }
    AppState.chatProducts.push(product);

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = 'b';

    const content = document.createElement('div');
    content.className = 'message-content';

    // Создаем карточку товара
    const cardWrapper = document.createElement('div');
    cardWrapper.style.width = '100%';

    const card = document.createElement('div');
    card.className = 'product-card-chat';
    card.setAttribute('data-product-id', product.id);

    // Картинка
    const img = document.createElement('img');
    img.src = product.picture;
    img.alt = product.name;
    img.className = 'product-image-chat';
    img.onclick = () => window.open(product.link, '_blank');

    // Информация о товаре
    const info = document.createElement('div');
    info.className = 'product-info-chat';

    const name = document.createElement('div');
    name.className = 'product-name-chat';
    name.textContent = product.name;
    name.onclick = () => window.open(product.link, '_blank');

    const price = document.createElement('div');
    price.className = 'product-price-chat';
    price.textContent = formatPrice(product.price);

    info.appendChild(name);
    info.appendChild(price);

    if (product.description) {
        const desc = document.createElement('div');
        desc.className = 'product-description-chat';
        desc.textContent = product.description;
        info.appendChild(desc);
    }

    if (product.size) {
        const size = document.createElement('div');
        size.className = 'product-size-chat';
        size.textContent = `Размер: ${product.size}`;
        info.appendChild(size);
    }

    // Рейтинг и отзывы
    if (product.rating || product.ammountOfReviews) {
        const meta = document.createElement('div');
        meta.className = 'product-meta-chat';

        if (product.rating) {
            const rating = document.createElement('div');
            rating.className = 'product-rating';
            rating.innerHTML = `<span class="stars">${generateStars(product.rating)}</span>`;
            meta.appendChild(rating);
        }

        if (product.ammountOfReviews) {
            const reviews = document.createElement('div');
            reviews.className = 'product-reviews';
            reviews.textContent = `(${product.ammountOfReviews} отзывов)`;
            meta.appendChild(reviews);
        }

        info.appendChild(meta);
    }

    // Нижняя строка с кнопками и количеством
    const bottomRow = document.createElement('div');
    bottomRow.className = 'product-bottom-row';

    // Кнопки лайк/дизлайк
    const actions = document.createElement('div');
    actions.className = 'product-actions-chat';

    const likeBtn = document.createElement('button');
    likeBtn.className = 'like-btn';
    likeBtn.textContent = '👍 Нравится';
    likeBtn.onclick = (e) => {
        e.stopPropagation();
        likeProduct(product.id);
    };

    const dislikeBtn = document.createElement('button');
    dislikeBtn.className = 'dislike-btn';
    dislikeBtn.textContent = '👎 Не то';
    dislikeBtn.onclick = (e) => {
        e.stopPropagation();
        dislikeProduct(product.id);
    };

    actions.appendChild(likeBtn);
    actions.appendChild(dislikeBtn);

    // Управление количеством
    const quantityDiv = document.createElement('div');
    quantityDiv.className = 'product-quantity-chat';

    const qtyLabel = document.createElement('span');
    qtyLabel.textContent = 'Количество:';

    const qtyControls = document.createElement('div');
    qtyControls.className = 'product-qty-controls';

    const minusBtn = document.createElement('button');
    minusBtn.className = 'product-qty-btn';
    minusBtn.textContent = '−';
    minusBtn.onclick = (e) => {
        e.stopPropagation();
        updateProductCount(product.id, -1);
    };

    const qtyDisplay = document.createElement('span');
    qtyDisplay.className = 'product-qty-display';
    qtyDisplay.textContent = product.countOfProduct || 1;
    qtyDisplay.id = `product-qty-${product.id}`;

    const plusBtn = document.createElement('button');
    plusBtn.className = 'product-qty-btn';
    plusBtn.textContent = '+';
    plusBtn.onclick = (e) => {
        e.stopPropagation();
        updateProductCount(product.id, 1);
    };

    qtyControls.appendChild(minusBtn);
    qtyControls.appendChild(qtyDisplay);
    qtyControls.appendChild(plusBtn);

    quantityDiv.appendChild(qtyLabel);
    quantityDiv.appendChild(qtyControls);

    bottomRow.appendChild(actions);
    bottomRow.appendChild(quantityDiv);

    info.appendChild(bottomRow);

    card.appendChild(img);
    card.appendChild(info);
    cardWrapper.appendChild(card);

    const time_el = document.createElement('div');
    time_el.className = 'message-time';
    time_el.textContent = formatTime();

    content.appendChild(cardWrapper);
    content.appendChild(time_el);

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    messagesContainer.appendChild(messageDiv);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
async function sendMessageToBackend(message) {
    const token = getToken();
    
    if (!token) {
        addMessage('Ошибка: необходима авторизация', false);
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    
    try {
        const response = await fetch('/api/chat/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                message: message,
                params: AppState.params, // Отправляем параметры поездки
                chatHistory: AppState.chatHistory.slice(-10) // Последние 10 сообщений для контекста
            })
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                removeToken();
                window.location.href = 'login.html';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Добавляем текстовый ответ от бота
        if (data.message) {
            addMessage(data.message, false);
        }
        
        // Добавляем карточки товаров, если есть
        if (data.products && data.products.length > 0) {
            data.products.forEach(product => {
                // Убеждаемся, что у товара есть ID
                if (!product.id) {
                    product.id = AppState.nextProductId++;
                }
                // Добавляем карточку в чат
                addProductCardToChat(product);
            });
        }
        
        // Добавляем кнопки с вариантами ответов, если есть
        if (data.buttons && data.buttons.length > 0) {
            const buttonOptions = data.buttons.map(btn => ({
                text: btn.text,
                action: btn.action || 'custom',
                value: btn.value || btn.text
            }));
            addMessage('Выберите вариант:', false, buttonOptions);
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        addMessage('Ошибка связи с сервером. Попробуйте позже.', false);
    }
}

// Обновленная функция initChat
function initChat() {
    const searchQuery = sessionStorage.getItem('searchQuery');
    
    if (searchQuery) {
        addMessage(searchQuery, true);
        // Отправляем запрос на бэкенд вместо simulateAIResponse
        sendMessageToBackend(searchQuery);
        sessionStorage.removeItem('searchQuery');
    } else {
        addMessage('Здравствуйте! Давайте подберём товары для вашей поездки!', false);
    }
    
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    
    const sendMessage = () => {
        const message = messageInput.value.trim();
        if (message) {
            addMessage(message, true);
            messageInput.value = '';
            // Отправляем на бэкенд вместо simulateAIResponse
            sendMessageToBackend(message);
        }
    };
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
}

// Обновленная функция для кнопок (лайк/дизлайк)
async function likeProduct(productId) {
    const product = AppState.chatProducts.find(p => p.id === productId);
    if (product) {
        addToCart(product);
        addMessage('Отлично! Добавил этот товар в корзину 🛒', false);
        
        // Уведомляем бэкенд о лайке (опционально)
        try {
            const token = getToken();
            if (token) {
                await fetch('/api/chat/feedback', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        productId: productId,
                        feedback: 'like'
                    })
                });
            }
        } catch (error) {
            console.error('Error sending feedback:', error);
        }
    }
}

async function dislikeProduct(productId) {
    addMessage('Понял, поищу другие варианты 🔍', false);
    
    // Отправляем дизлайк на бэкенд для улучшения рекомендаций
    try {
        const token = getToken();
        if (token) {
            await fetch('/api/chat/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId: productId,
                    feedback: 'dislike'
                })
            });
            
            // Запрашиваем новые рекомендации
            sendMessageToBackend('Покажи другие варианты');
        }
    } catch (error) {
        console.error('Error sending feedback:', error);
    }
}

// Обновленная функция для сохранения параметров
async function saveParam(paramType) {
    let value, message;
    
    if (paramType === 'address') {
        value = document.getElementById('addressInput').value.trim();
        if (!value) return;
        AppState.params.address = value;
        message = `Адрес: ${value}`;
        document.getElementById('addressInput').value = '';
    } else if (paramType === 'budget') {
        value = document.getElementById('budgetInput').value.trim();
        if (!value) return;
        AppState.params.budget = value;
        message = `Бюджет: ${formatPrice(parseInt(value))}`;
        document.getElementById('budgetInput').value = '';
    } else if (paramType === 'wishes') {
        value = document.getElementById('wishesInput').value.trim();
        if (!value) return;
        AppState.params.wishes = value;
        message = `Пожелания: ${value}`;
        document.getElementById('wishesInput').value = '';
    }
    
    addMessage(message, true);
    renderParams();
    
    // Отправляем обновленные параметры на бэкенд
    sendMessageToBackend(`Обновил параметры: ${message}`);
}
// Обновление количества товара в карточке
function updateProductCount(productId, delta) {
    const product = AppState.chatProducts.find(p => p.id === productId);
    if (!product) return;

    product.countOfProduct = (product.countOfProduct || 1) + delta;

    if (product.countOfProduct < 1) {
        product.countOfProduct = 1;
    }

    const qtyDisplay = document.getElementById(`product-qty-${productId}`);
    if (qtyDisplay) {
        qtyDisplay.textContent = product.countOfProduct;
    }
}

function simulateAIResponse() {
    setTimeout(() => {
        const responses = [
            'Понял! Добавил эту информацию.',
            'Отлично! Обновляю данные...',
            'Хорошо, я учту это при подборе.',
            'Записал ваши пожелания!'
        ];

        const response = responses[Math.floor(Math.random() * responses.length)];
        addMessage(response, false);
    }, 800);
}

function handleButtonClick(action, value) {
    addMessage(`Я выбрал: ${value}`, true);
    simulateAIResponse();
}

function initChat() {
    const searchQuery = sessionStorage.getItem('searchQuery');

    if (searchQuery) {
        addMessage(searchQuery, true);
        addMessage('Отлично! Давайте уточним параметры вашей поездки.', false);
        sessionStorage.removeItem('searchQuery');

        // Демонстрация: добавляем пример карточки товара от бота
        setTimeout(() => {
            const exampleProduct = {
                id: AppState.nextProductId++,
                name: 'Рюкзак туристический 60L',
                link: 'https://example.com/product/1',
                description: 'Водонепроницаемый рюкзак для длительных походов',
                price: 4500,
                picture: 'https://via.placeholder.com/120x120/4A90E2/ffffff?text=Backpack',
                rating: 4,
                ammountOfReviews: 127,
                size: '60L',
                countOfProduct: 1
            };
            addProductCardToChat(exampleProduct);
        }, 2000);
    } else {
        addMessage('Здравствуйте! Давайте подберём товары для вашей поездки!', false);
    }

    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');

    const sendMessage = () => {
        const message = messageInput.value.trim();
        if (message) {
            addMessage(message, true);
            messageInput.value = '';
            simulateAIResponse();
        }
    };

    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }

    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
}

// ===== ФУНКЦИИ ПАРАМЕТРОВ =====
function saveParam(paramType) {
    let value, message;

    if (paramType === 'address') {
        value = document.getElementById('addressInput').value.trim();
        if (!value) return;
        AppState.params.address = value;
        message = `Адрес: ${value}`;
        document.getElementById('addressInput').value = '';
    } else if (paramType === 'budget') {
        value = document.getElementById('budgetInput').value.trim();
        if (!value) return;
        AppState.params.budget = value;
        message = `Бюджет: ${formatPrice(parseInt(value))}`;
        document.getElementById('budgetInput').value = '';
    } else if (paramType === 'wishes') {
        value = document.getElementById('wishesInput').value.trim();
        if (!value) return;
        AppState.params.wishes = value;
        message = `Пожелания: ${value}`;
        document.getElementById('wishesInput').value = '';
    }

    addMessage(message, true);
    simulateAIResponse();
    renderParams();
}

function renderParams() {
    const paramsList = document.getElementById('paramsList');
    if (!paramsList) return;

    const hasParams = AppState.params.address || AppState.params.budget || AppState.params.wishes;

    if (!hasParams) {
        paramsList.innerHTML = '<p class="empty-message">Параметры не заданы</p>';
        return;
    }

    let html = '';

    if (AppState.params.address) {
        html += `<div style="margin-bottom: 0.5rem;"><strong>📍 Адрес:</strong> ${AppState.params.address}</div>`;
    }
    if (AppState.params.budget) {
        html += `<div style="margin-bottom: 0.5rem;"><strong>💰 Бюджет:</strong> ${formatPrice(parseInt(AppState.params.budget))}</div>`;
    }
    if (AppState.params.wishes) {
        html += `<div style="margin-bottom: 0.5rem;"><strong>💭 Пожелания:</strong> ${AppState.params.wishes}</div>`;
    }

    paramsList.innerHTML = html;
}

// ===== ФУНКЦИИ СПИСКА НЕОБХОДИМОГО (БЕЗ ЦЕНЫ) =====
function initOffers() {
    const addOfferBtn = document.getElementById('addOfferBtn');
    const offerForm = document.getElementById('offerForm');
    const saveOfferBtn = document.getElementById('saveOfferBtn');
    const cancelOfferBtn = document.getElementById('cancelOfferBtn');

    if (addOfferBtn) {
        addOfferBtn.addEventListener('click', () => {
            AppState.editingOfferId = null;
            offerForm.style.display = 'block';
        });
    }

    if (cancelOfferBtn) {
        cancelOfferBtn.addEventListener('click', () => {
            offerForm.style.display = 'none';
            AppState.editingOfferId = null;
            clearOfferForm();
        });
    }

    if (saveOfferBtn) {
        saveOfferBtn.addEventListener('click', () => {
            const name = document.getElementById('offerName').value.trim();
            const desc = document.getElementById('offerDesc').value.trim();
            const count = document.getElementById('offerCount').value.trim() || '1';

            if (!name) {
                alert('Заполните название товара');
                return;
            }

            if (AppState.editingOfferId !== null) {
                // Редактируем существующий товар
                const offer = AppState.offers.find(o => o.id === AppState.editingOfferId);
                if (offer) {
                    offer.name = name;
                    offer.desc = desc;
                    offer.count = parseInt(count);
                }
                addMessage(`Обновил товар "${name}"`, true);
            } else {
                // Добавляем новый товар (БЕЗ ЦЕНЫ!)
                const offer = {
                    id: AppState.nextOfferId++,
                    name,
                    desc,
                    count: parseInt(count)
                };

                AppState.offers.push(offer);
                addMessage(`Добавил товар "${name}" в список необходимого`, true);
            }

            renderOffers();
            offerForm.style.display = 'none';
            AppState.editingOfferId = null;
            clearOfferForm();
            simulateAIResponse();
        });
    }
}

function clearOfferForm() {
    document.getElementById('offerName').value = '';
    document.getElementById('offerDesc').value = '';
    document.getElementById('offerCount').value = '1';
}

function editOffer(offerId) {
    const offer = AppState.offers.find(o => o.id === offerId);
    if (!offer) return;

    AppState.editingOfferId = offerId;

    document.getElementById('offerName').value = offer.name;
    document.getElementById('offerDesc').value = offer.desc || '';
    document.getElementById('offerCount').value = offer.count;

    document.getElementById('offerForm').style.display = 'block';
}

function deleteOffer(offerId) {
    const idx = AppState.offers.findIndex(o => o.id === offerId);
    if (idx !== -1) {
        AppState.offers.splice(idx, 1);
        renderOffers();
    }
}

function updateOfferCount(offerId, delta) {
    const offer = AppState.offers.find(o => o.id === offerId);
    if (!offer) return;

    offer.count += delta;

    if (offer.count < 1) {
        offer.count = 1;
    }

    renderOffers();
}

function renderOffers() {
    const offersList = document.getElementById('offersList');
    if (!offersList) return;

    if (AppState.offers.length === 0) {
        offersList.innerHTML = '<p class="empty-message">Список пуст</p>';
        return;
    }

    offersList.innerHTML = '';

    AppState.offers.forEach(offer => {
        const offerItem = document.createElement('div');
        offerItem.className = 'offer-item';

        offerItem.innerHTML = `
            <div class="offer-header">
                <div class="offer-content">
                    <div class="offer-name">${offer.name}</div>
                    ${offer.desc ? `<div class="offer-desc">${offer.desc}</div>` : ''}
                </div>
                <div class="offer-actions">
                    <button class="edit-offer-btn" onclick="editOffer(${offer.id})" title="Редактировать">✎</button>
                    <button class="delete-offer-btn" onclick="deleteOffer(${offer.id})" title="Удалить">×</button>
                </div>
            </div>
            <div class="offer-quantity">
                <span>Количество:</span>
                <div class="qty-controls">
                    <button class="qty-btn-small" onclick="updateOfferCount(${offer.id}, -1)">−</button>
                    <span class="qty-display">${offer.count}</span>
                    <button class="qty-btn-small" onclick="updateOfferCount(${offer.id}, 1)">+</button>
                </div>
            </div>
        `;

        offersList.appendChild(offerItem);
    });
}

// ===== ФУНКЦИИ КОРЗИНЫ =====
function addToCart(product) {
    const existing = AppState.cart.find(item => item.id === product.id);

    if (!existing) {
        AppState.cart.push({
            ...product,
            countOfProduct: product.countOfProduct || 1
        });
        renderCart();
    }
}

function removeFromCart(productId) {
    AppState.cart = AppState.cart.filter(item => item.id !== productId);
    renderCart();
}

function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const cartSummary = document.getElementById('cartSummary');
    const emptyCart = document.getElementById('emptyCart');

    if (!cartItems) return;

    if (AppState.cart.length === 0) {
        cartItems.innerHTML = '';
        if (cartSummary) cartSummary.style.display = 'none';
        if (emptyCart) emptyCart.style.display = 'block';
        return;
    }

    cartItems.innerHTML = '';
    let total = 0;

    AppState.cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';

        const itemTotal = item.price * (item.countOfProduct || 1);
        total += itemTotal;

        cartItem.innerHTML = `
            <img src="${item.picture}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-content">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${formatPrice(item.price)} × ${item.countOfProduct || 1}</div>
            </div>
            <button class="remove-from-cart-btn" onclick="removeFromCart(${item.id})" title="Удалить">×</button>
        `;

        cartItems.appendChild(cartItem);
    });

    if (emptyCart) emptyCart.style.display = 'none';
    if (cartSummary) {
        cartSummary.style.display = 'block';
        document.getElementById('totalItems').textContent = AppState.cart.length;
        document.getElementById('totalSum').textContent = formatPrice(total);
    }
}

// ===== ФУНКЦИИ АВТОРИЗАЦИИ =====
async function makeAuthenticatedRequest(url, method = 'GET', body = null) {
  const token = getToken();
  
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `${token}`
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    
    if (response.status === 401) {
      // Токен истёк или невалиден
      removeToken();
      window.location.href = 'login.html';
      return;
    }

    return await response.json();
  } catch (error) {
    console.error('Ошибка запроса:', error);
    throw error;
  }
}

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    const successEl = document.getElementById('loginSuccess');

    // Скрываем предыдущие сообщения
    errorEl.classList.remove('show');
    successEl.classList.remove('show');

    if (!email || !password) {
        errorEl.textContent = 'Заполните все поля';
        errorEl.classList.add('show');
        return;
    }

    if (password.length <= 8) {
        errorEl.textContent = 'Пароль должен быть не менее 8 символов';
        errorEl.classList.add('show');
        return;
    }

    try {
        // Хэшируем пароль
        const hashedPassword = await hashPassword(password);

        // Отправляем POST-запрос
        const response = await fetch('http://localhost:5050/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                login: email,
                password: hashedPassword
            }),
        });

        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }

        const data = await response.json();

        // Сохраняем токен
        if (data.token) {
          saveToken(data.token);
        }
        // Успешный вход
        successEl.textContent = 'Вход выполнен успешно! Перенаправление...';
        successEl.classList.add('show');

        AppState.currentUser = { email, ...data };

        setTimeout(() => {
            window.location.href = 'chat.html';
        }, 1500);

    } catch (error) {
        errorEl.textContent = 'Ошибка входа: ' + error.message;
        errorEl.classList.add('show');
    }
}

async function handlePasswordChange(e) {
    e.preventDefault();
    
    const email = document.getElementById('changeEmail').value.trim();
    const password = document.getElementById('changePassword').value;
    const passwordConfirm = document.getElementById('changePasswordConfirm').value;
    const errorEl = document.getElementById('changeError');
    const successEl = document.getElementById('changeSuccess');
    
    // Очищаем предыдущие сообщения
    if (errorEl) errorEl.classList.remove('show');
    if (successEl) successEl.classList.remove('show');
    
    // Валидация полей
    if (!email || !password || !passwordConfirm) {
        if (errorEl) {
            errorEl.textContent = 'Заполните все поля';
            errorEl.classList.add('show');
        }
        return;
    }
    
    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        if (errorEl) {
            errorEl.textContent = 'Введите корректный email';
            errorEl.classList.add('show');
        }
        return;
    }
    
    // Валидация пароля
    const passwordError = validatePassword(password);
    if (passwordError) {
        if (errorEl) {
            errorEl.textContent = passwordError;
            errorEl.classList.add('show');
        }
        return;
    }
    
    // Проверка совпадения паролей
    if (password !== passwordConfirm) {
        if (errorEl) {
            errorEl.textContent = 'Пароли не совпадают';
            errorEl.classList.add('show');
        }
        return;
    }
    
    try {
        // Получаем токен из URL (если есть)
        const urlParams = new URLSearchParams(window.location.search);
        const resetToken = urlParams.get('token');
        
        if (!resetToken) {
            if (errorEl) {
                errorEl.textContent = 'Недействительная ссылка для сброса пароля';
                errorEl.classList.add('show');
            }
            return;
        }
        
        // Хешируем пароль
        const hashedPassword = await hashPassword(password);
        
        // Отправка запроса на бэкенд
        const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                token: resetToken,
                password: hashedPassword
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Успех
            if (successEl) {
                successEl.textContent = 'Пароль успешно изменён! Перенаправление...';
                successEl.classList.add('show');
            }
            
            // Очищаем поля
            document.getElementById('changeEmail').value = '';
            document.getElementById('changePassword').value = '';
            document.getElementById('changePasswordConfirm').value = '';
            
            // Перенаправление на страницу входа
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            // Ошибка от сервера
            if (errorEl) {
                errorEl.textContent = data.message || 'Ошибка при изменении пароля';
                errorEl.classList.add('show');
            }
        }
    } catch (error) {
        // Ошибка сети
        if (errorEl) {
            errorEl.textContent = 'Ошибка соединения с сервером';
            errorEl.classList.add('show');
        }
        console.error('Password change error:', error);
    }
}


async function handleRegister(e) {
    e.preventDefault();

    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    const errorEl = document.getElementById('registerError');
    const successEl = document.getElementById('registerSuccess');

    errorEl.classList.remove('show');
    successEl.classList.remove('show');

    if (!email || !password || !passwordConfirm) {
        errorEl.textContent = 'Заполните все обязательные поля';
        errorEl.classList.add('show');
        return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
        errorEl.textContent = passwordError;
        errorEl.classList.add('show');
        return;
    }

    if (password !== passwordConfirm) {
        errorEl.textContent = 'Пароли не совпадают';
        errorEl.classList.add('show');
        return;
    }

    try {
        // Хэшируем пароль
        const hashedPassword = await hashPassword(password);

        // Отправляем POST-запрос на регистрацию
        const response = await fetch('http://localhost:5050/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                login: email,
                password: hashedPassword
            }),
        });

        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }

        const data = await response.json();

        // Сохраняем токен
        if (data.token) {
          saveToken(data.token);
        }

        // Успешная регистрация
        successEl.textContent = 'Регистрация успешна! Перенаправление...';
        successEl.classList.add('show');

        AppState.currentUser = { email, ...data };

        setTimeout(() => {
            window.location.href = 'chat.html';
        }, 1500);

    } catch (error) {
        errorEl.textContent = 'Ошибка регистрации: ' + error.message;
        errorEl.classList.add('show');
    }
}

function initAuth() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

function checkAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = 'login.html';
  }
}

// Выход из аккаунта
function handleLogout() {
  removeToken();
  window.location.href = 'login.html';
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'chat.html' || currentPage === '') {
        initTabs();
        initChat();
        initOffers();
        renderParams();
        renderOffers();
        renderCart();
    } else if (currentPage === 'login.html' || currentPage === 'register.html') {
        initAuth();
    }
});

// Глобальные функции
window.saveParam = saveParam;
window.editOffer = editOffer;
window.deleteOffer = deleteOffer;
window.updateOfferCount = updateOfferCount;
window.removeFromCart = removeFromCart;
window.likeProduct = likeProduct;
window.dislikeProduct = dislikeProduct;
window.updateProductCount = updateProductCount;
window.addProductCardToChat = addProductCardToChat;
window.hashPassword = hashPassword;
window.sendMessageToBackend = sendMessageToBackend;