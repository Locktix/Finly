// ======================
// LOADING SPINNERS
// ======================
function showSpinner(buttonEl, originalText = '') {
    buttonEl.disabled = true;
    buttonEl.dataset.originalText = originalText || buttonEl.innerHTML;
    buttonEl.innerHTML = '<span class="toast-spinner"></span> Chargement...';
}

function hideSpinner(buttonEl) {
    buttonEl.disabled = false;
    buttonEl.innerHTML = buttonEl.dataset.originalText || 'Soumettre';
}

// ======================
// TOAST NOTIFICATIONS SYSTEM
// ======================
const Toast = {
    show(type, title, message, duration = 4000) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let icon = '';
        switch(type) {
            case 'success':
                icon = '<i class="fas fa-check-circle toast-icon"></i>';
                break;
            case 'error':
                icon = '<i class="fas fa-exclamation-circle toast-icon"></i>';
                break;
            case 'info':
                icon = '<i class="fas fa-info-circle toast-icon"></i>';
                break;
            case 'warning':
                icon = '<i class="fas fa-warning toast-icon"></i>';
                break;
            case 'loading':
                icon = '<div class="toast-spinner"></div>';
                break;
        }

        toast.innerHTML = `
            ${icon}
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                ${message ? `<div class="toast-message">${message}</div>` : ''}
            </div>
            <button class="toast-close">&times;</button>
        `;

        container.appendChild(toast);

        // Close button listener
        toast.querySelector('.toast-close').addEventListener('click', () => {
            removeToast(toast);
        });

        // Auto-remove after duration (skip if loading)
        if (type !== 'loading' && duration > 0) {
            setTimeout(() => {
                removeToast(toast);
            }, duration);
        }

        return toast;
    },

    success(title, message = '', duration = 3000) {
        return this.show('success', title, message, duration);
    },

    error(title, message = '', duration = 4000) {
        return this.show('error', title, message, duration);
    },

    info(title, message = '', duration = 3000) {
        return this.show('info', title, message, duration);
    },

    warning(title, message = '', duration = 3500) {
        return this.show('warning', title, message, duration);
    },

    loading(title, message = '') {
        return this.show('loading', title, message, 0);
    }
};

function removeToast(toastElement) {
    toastElement.classList.add('fade-out');
    setTimeout(() => {
        toastElement.remove();
    }, 300);
}