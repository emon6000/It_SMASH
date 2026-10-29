// Copy-paste email / message text for an order.
const money = (n) => `৳${Number(n).toLocaleString('en-US')}`;

const STATUS_TEXT = {
  pending:    { en: 'We have received your order and will call you shortly to confirm.', bn: 'আপনার অর্ডারটি পেয়েছি। কনফার্ম করতে শীঘ্রই কল করা হবে।' },
  confirmed:  { en: 'Your order is confirmed.', bn: 'আপনার অর্ডারটি কনফার্ম করা হয়েছে।' },
  processing: { en: 'Your order is being prepared.', bn: 'আপনার অর্ডারটি প্রস্তুত করা হচ্ছে।' },
  shipped:    { en: 'Your order has been shipped.', bn: 'আপনার অর্ডারটি পাঠানো হয়েছে।' },
  delivered:  { en: 'Your order has been delivered. Thank you for shopping with us!', bn: 'আপনার অর্ডারটি ডেলিভারি হয়েছে। আমাদের সাথে কেনাকাটার জন্য ধন্যবাদ!' },
  cancelled:  { en: 'Your order has been cancelled.', bn: 'আপনার অর্ডারটি বাতিল করা হয়েছে।' },
  returned:   { en: 'Your order return has been recorded.', bn: 'আপনার অর্ডারের রিটার্ন নথিভুক্ত করা হয়েছে।' },
};

const itemLine = (i) => {
  const opts = Object.entries(i.options || {}).map(([k, v]) => `${k}: ${v}`).join(', ');
  return `- ${i.name}${opts ? ` (${opts})` : ''} x ${i.qty} = ${money(i.price * i.qty)}`;
};

function buildTemplates(order, items, siteName, trackUrl) {
  const st = STATUS_TEXT[order.status] || STATUS_TEXT.pending;
  const summary =
    `Order No: ${order.order_number}\nName: ${order.customer_name}\nPhone: ${order.phone}\n` +
    `Address: ${order.address}, ${order.district}\n\nItems:\n${items.map(itemLine).join('\n')}\n\n` +
    `Subtotal: ${money(order.subtotal)}\n` +
    (Number(order.discount) ? `Discount: -${money(order.discount)}\n` : '') +
    `Delivery: ${money(order.shipping_fee)}\nTotal: ${money(order.total)}\n` +
    `Payment: ${order.payment_method === 'bkash' ? 'bKash' : 'Cash on Delivery'}`;
  const courier = order.courier_note ? `\nCourier/Tracking: ${order.courier_note}` : '';
  const track = trackUrl ? `\nTrack your order: ${trackUrl}` : '';
  return {
    email: {
      subject: `${siteName} - Order ${order.order_number} (${order.status})`,
      body: `Hello ${order.customer_name},\n\n${st.en}\n\n${summary}${courier}${track}\n\nThank you,\n${siteName}`,
    },
    message_en: `Hello ${order.customer_name}, ${st.en}\n\n${summary}${courier}${track}\n- ${siteName}`,
    message_bn: `আসসালামু আলাইকুম ${order.customer_name}, ${st.bn}\n\n${summary}${courier}${track}\n- ${siteName}`,
  };
}

module.exports = { buildTemplates, STATUS_TEXT };
