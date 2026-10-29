// Mirrors the server's pricing rules (server always recalculates at checkout).
export function calcTotals(items, cfg, district = 'Dhaka', payment = 'cod') {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const qty = items.reduce((s, i) => s + i.qty, 0);
  const tiers = (cfg?.discountTiers || []).slice();
  const tier = tiers.filter((t) => qty >= t.minQty).sort((a, b) => b.minQty - a.minQty)[0];
  const nextTier = tiers.filter((t) => t.minQty > qty).sort((a, b) => a.minQty - b.minQty)[0];
  const discount = tier ? Math.round((subtotal * tier.percent) / 100) : 0;
  const after = subtotal - discount;
  const ship = cfg?.shipping || {};
  let shipping = district.toLowerCase() === 'dhaka' ? ship.insideDhaka ?? 70 : ship.outsideDhaka ?? 130;
  if (payment === 'bkash' && ship.freeWithBkash) shipping = 0;
  if (ship.freeThreshold && after >= ship.freeThreshold) shipping = 0;
  const total = after + (items.length ? shipping : 0);
  const toFree = ship.freeThreshold && shipping > 0 ? Math.max(0, ship.freeThreshold - after) : 0;
  return { subtotal, qty, discount, shipping: items.length ? shipping : 0, total, tier, nextTier, toFree };
}

export const DISTRICTS = ['Dhaka','Gazipur','Narayanganj','Narsingdi','Manikganj','Munshiganj','Tangail','Kishoreganj','Faridpur','Gopalganj','Madaripur','Rajbari','Shariatpur','Chattogram','Cox\'s Bazar','Cumilla','Feni','Brahmanbaria','Chandpur','Lakshmipur','Noakhali','Bandarban','Khagrachhari','Rangamati','Sylhet','Moulvibazar','Habiganj','Sunamganj','Rajshahi','Bogura','Joypurhat','Naogaon','Natore','Chapainawabganj','Pabna','Sirajganj','Khulna','Bagerhat','Chuadanga','Jashore','Jhenaidah','Kushtia','Magura','Meherpur','Narail','Satkhira','Barishal','Barguna','Bhola','Jhalokathi','Patuakhali','Pirojpur','Rangpur','Dinajpur','Gaibandha','Kurigram','Lalmonirhat','Nilphamari','Panchagarh','Thakurgaon','Mymensingh','Jamalpur','Netrokona','Sherpur'];
