import type { Dictionary } from './types';

const th: Dictionary = {
  docTitle: 'ค้นหาที่นั่ง',
  heroTitle: 'ค้นหาที่นั่งของคุณ',
  heroDesc: 'พิมพ์ชื่อของคุณ แล้วแตะที่ชื่อเพื่อดูโต๊ะและที่นั่งบนผังงาน',
  searchPlaceholder: 'พิมพ์ชื่อของคุณ',
  chipsLabel: 'หรือเลือกดูตามโต๊ะ',
  legRound: 'โต๊ะจีน',
  legLong: 'โต๊ะยาว',
  legStage: 'เวที',
  legDoor: 'ประตู',
  planTitle: 'ผังงาน',
  hintTag: 'ลากเพื่อเลื่อนผัง ใช้ล้อเมาส์หรือสองนิ้วเพื่อซูม',
  zoomInTitle: 'ซูมเข้า',
  zoomOutTitle: 'ซูมออก',
  homeTitle: 'ดูผังทั้งห้อง',
  gpCloseLabel: 'ปิด',
  gpBackBtn: 'กลับไปดูผังทั้งห้อง',
  gpShowAll: (n) => `ดูรายชื่อทั้งโต๊ะ (${n} คน)`,
  gpShowLess: 'ย่อรายชื่อ',
  tableWordPrefix: 'โต๊ะ ',
  seatsSuffix: (n) => `${n} ที่นั่ง`,
  seatInline: (seat) => `ที่นั่ง ${seat}`,
  capacityFraction: (a, b) => `${a} / ${b} ที่นั่ง`,
  emptySeatLabel: 'ว่าง',
  noGuestForTable: 'ยังไม่มีแขกนั่งโต๊ะนี้',
  searchEmpty: 'ไม่พบชื่อนี้ ลองตรวจตัวสะกด หรือพิมพ์แค่ชื่อจริง',
  location: (side, depth) => {
    const d = { front: 'ด้านหน้า ใกล้เวที', middle: 'กลางห้อง', back: 'ด้านหลังห้อง' }[depth];
    const s = { left: 'ฝั่งซ้าย', center: 'แนวกลาง', right: 'ฝั่งขวา' }[side];
    return side === 'center' && depth === 'middle' ? 'กลางห้อง' : `${s} · ${d}`;
  },
  viewOnPlan: 'ดูผัง',
  toastTableNotFound: (table) => `ไม่พบโต๊ะ "${table}" ในผัง กรุณาสอบถามเจ้าหน้าที่`,
  langToggleTitle: 'เปลี่ยนภาษา / Switch language',
};

export default th;
