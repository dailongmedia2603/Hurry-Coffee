export const formatPrice = (price: number) => {
    if (isNaN(price)) {
        return '0 ₫';
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

export const formatDisplayPhone = (phone: string) => {
    if (!phone) return '';
    // Simple formatting: 0912 345 678
    if (phone.length === 10) {
        return `${phone.substring(0, 4)} ${phone.substring(4, 7)} ${phone.substring(7, 10)}`;
    }
    return phone;
};