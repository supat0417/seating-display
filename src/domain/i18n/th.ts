import type { Dictionary } from './types';

const th: Dictionary = {
  docTitle: 'seating display',
  heroTitle: 'ค้นหาที่นั่งของคุณ',
  heroDesc: 'พิมพ์ชื่อของคุณด้านล่าง แล้วแตะผลลัพธ์เพื่อดูตำแหน่งโต๊ะบนผังงาน',
  searchPlaceholder: 'พิมพ์ชื่อ-นามสกุลของคุณ...',
  chipsLabel: 'หรือเลือกโต๊ะโดยตรง',
  legRound: 'โต๊ะจีน',
  legLong: 'Long table',
  legStage: 'เวที',
  legDoor: 'ประตู',
  planTitle: 'ผังที่นั่งงาน',
  hintTag: 'ลากเพื่อเลื่อนผัง · เลื่อนล้อเมาส์เพื่อซูม',
  zoomInTitle: 'ซูมเข้า',
  zoomOutTitle: 'ซูมออก',
  homeTitle: 'ภาพรวมทั้งหมด',
  gpCloseLabel: 'ปิด',
  gpBackBtn: '◆ กลับสู่ภาพรวมทั้งหมด',
  tableWordPrefix: 'โต๊ะ ',
  seatsSuffix: (n) => `${n} ที่นั่ง`,
  seatInline: (seat) => `ที่นั่ง ${seat}`,
  capacityFraction: (a, b) => `${a} / ${b} ที่นั่ง`,
  emptySeatLabel: 'ว่าง',
  noGuestForTable: 'ยังไม่มีแขกที่กำหนดให้โต๊ะนี้',
  searchEmpty: 'ไม่พบชื่อนี้ในระบบ ลองตรวจสอบการสะกดอีกครั้ง',
  toastTableNotFound: (table) => `ไม่พบตำแหน่งโต๊ะ "${table}" ในผัง`,
  langToggleTitle: 'เปลี่ยนภาษา / Switch language',
};

export default th;
