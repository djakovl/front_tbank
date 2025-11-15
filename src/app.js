// ===== ИМПОРТЫ =====
import { 
    formatPrice, 
    formatTime, 
    generateStars, 
    getToken, 
    removeToken,
    initTabs
} from './utils.js';

import { initAuth } from './login.js';

// ===== ДАННЫЕ И СОСТОЯНИЕ =====
const AppState = {
    params: {
        address: null,
        budget: null,
        wishes: null
    },
    offers: [], // Список необходимого (БЕЗ цены)
    cart: [], // Корзина с карточками от бота
    chatProducts: [], // Товары, показанные в чате
    chatHistory: [],
    currentUser: null,
    nextOfferId: 1,
    nextProductId: 1,
    editingOfferId: null
};

// ===== ФУНКЦИИ ЧАТА =====

// Добавление текстового сообщения
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

// Добавление карточки товара в чат
function addProductCardToChat(product) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;

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

    // Информация
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

    // Нижняя строка
    const bottomRow = document.createElement('div');
    bottomRow.className = 'product-bottom-row';

    // Кнопки
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

    // Количество
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

// Обновление количества товара
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

// Отправка сообщения на бэкенд
async function sendMessageToBackend(message) {
    const token = getToken();

    if (!token) {
        addMessage('Ошибка: необходима авторизация', false);
        setTimeout(() => {
            window.location.href = '../html/login.html';
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
                params: AppState.params,
                chatHistory: AppState.chatHistory.slice(-10)
            })
        });

        if (!response.ok) {
            if (response.status === 401) {
                removeToken();
                window.location.href = '../html/login.html';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.message) {
            addMessage(data.message, false);
        }

        if (data.products && data.products.length > 0) {
            data.products.forEach(product => {
                if (!product.id) {
                    product.id = AppState.nextProductId++;
                }
                addProductCardToChat(product);
            });
        }

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

// Лайк/дизлайк товара
async function likeProduct(productId) {
    const product = AppState.chatProducts.find(p => p.id === productId);
    if (product) {
        addToCart(product);
        addMessage('Отлично! Добавил этот товар в корзину 🛒', false);

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

            sendMessageToBackend('Покажи другие варианты');
        }
    } catch (error) {
        console.error('Error sending feedback:', error);
    }
}

function handleButtonClick(action, value) {
    addMessage(`Я выбрал: ${value}`, true);
    sendMessageToBackend(value);
}

// Инициализация чата
function initChat() {
    const searchQuery = sessionStorage.getItem('searchQuery');

    if (searchQuery) {
        addMessage(searchQuery, true);
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

// ===== ПАРАМЕТРЫ =====

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
    sendMessageToBackend(`Обновил параметры: ${message}`);
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

// ===== СПИСОК НЕОБХОДИМОГО =====

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
                const offer = AppState.offers.find(o => o.id === AppState.editingOfferId);
                if (offer) {
                    offer.name = name;
                    offer.desc = desc;
                    offer.count = parseInt(count);
                }
                addMessage(`Обновил товар "${name}"`, true);
            } else {
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

// ===== КОРЗИНА =====

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
    } else if (currentPage === 'login.html' || currentPage === 'register.html' || 
               currentPage === 'change-password.html' || currentPage === 'reset-password.html') {
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
window.sendMessageToBackend = sendMessageToBackend;
