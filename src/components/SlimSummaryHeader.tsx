import React from 'react';
import { TranslationDictionary } from '../data/translations';

export interface SlimSummaryHeaderProps {
  todayCount?: number;
  lateCount?: number;
  onTodayPress: () => void;
  onLatePress: () => void;
  isTodayActive?: boolean;
  isLateActive?: boolean;
  isRtl?: boolean;
  translations?: TranslationDictionary;
}

/**
 * SlimSummaryHeader (ٹوڈے ڈیلیوری اور لیٹ آرڈرز کی باریک پٹی)
 * - فکسڈ 40px ہائٹ تاکہ یہ پھیلے نہیں اور سکرین پر جگہ بالکل نہ گھیرے
 * - todayCard: #fffdf4 مع #fce881 بارڈر
 * - lateCard: #fff5f5 مع #ffc9c9 بارڈر
 * - cardCount: #fff پس منظر، 13px بولڈ، 0.5px بارڈر
 */
export const SlimSummaryHeader: React.FC<SlimSummaryHeaderProps> = ({
  todayCount = 0,
  lateCount = 0,
  onTodayPress,
  onLatePress,
  isTodayActive = false,
  isLateActive = false,
  isRtl = true,
  translations,
}) => {
  const todayLabel = translations?.todayDelivery || (isRtl ? 'آج کی ڈیلیوری:' : "Today's Delivery:");
  const lateLabel = translations?.lateOrders || (isRtl ? 'لیٹ آرڈرز:' : 'Late Orders:');

  return (
    <div
      id="slim-summary-header"
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: 12,
        paddingRight: 12,
        marginTop: 4,
        marginBottom: 4,
        width: '100%',
        height: 40, // فکسڈ ہائٹ تاکہ یہ پھیلے نہیں اور جگہ بالکل نہ گھیرے
        zIndex: 1,
      }}
      className="select-none"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* ٹوڈے ڈیلیوری باریک پٹی */}
      <button
        type="button"
        id="slim-today-btn"
        onClick={onTodayPress}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 4,
          paddingBottom: 4,
          paddingLeft: 8,
          paddingRight: 8,
          borderRadius: 6,
          marginLeft: 4,
          marginRight: 4,
          borderWidth: 1,
          borderStyle: 'solid',
          backgroundColor: isTodayActive ? '#dcf8c6' : '#f0faf4',
          borderColor: isTodayActive ? '#00a884' : '#a7f3d0',
          height: '100%',
          cursor: 'pointer',
          outline: 'none',
        }}
        className="transition-all active:scale-[0.98] shadow-2xs"
        title={todayLabel}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#1f2937',
            marginRight: isRtl ? 0 : 6,
            marginLeft: isRtl ? 6 : 0,
            whiteSpace: 'nowrap',
          }}
        >
          {todayLabel}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 'bold',
            color: isTodayActive ? '#075e54' : '#111827',
            backgroundColor: '#fff',
            paddingLeft: 6,
            paddingRight: 6,
            paddingTop: 1,
            paddingBottom: 1,
            borderRadius: 4,
            overflow: 'hidden',
            borderWidth: 0.5,
            borderStyle: 'solid',
            borderColor: '#a7f3d0',
            minWidth: 20,
            textAlign: 'center',
            lineHeight: '16px',
          }}
        >
          {todayCount}
        </span>
      </button>

      {/* لیٹ آرڈرز باریک پٹی */}
      <button
        type="button"
        id="slim-late-btn"
        onClick={onLatePress}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 4,
          paddingBottom: 4,
          paddingLeft: 8,
          paddingRight: 8,
          borderRadius: 6,
          marginLeft: 4,
          marginRight: 4,
          borderWidth: 1,
          borderStyle: 'solid',
          backgroundColor: isLateActive ? '#fee2e2' : '#fff5f5',
          borderColor: isLateActive ? '#ef4444' : '#ffc9c9',
          height: '100%',
          cursor: 'pointer',
          outline: 'none',
        }}
        className="transition-all active:scale-[0.98] shadow-2xs"
        title={lateLabel}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#444',
            marginRight: isRtl ? 0 : 6,
            marginLeft: isRtl ? 6 : 0,
            whiteSpace: 'nowrap',
          }}
        >
          {lateLabel}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 'bold',
            color: isLateActive ? '#b91c1c' : lateCount > 0 ? '#d9534f' : '#111',
            backgroundColor: '#fff',
            paddingLeft: 6,
            paddingRight: 6,
            paddingTop: 1,
            paddingBottom: 1,
            borderRadius: 4,
            overflow: 'hidden',
            borderWidth: 0.5,
            borderStyle: 'solid',
            borderColor: '#ddd',
            minWidth: 20,
            textAlign: 'center',
            lineHeight: '16px',
          }}
        >
          {lateCount}
        </span>
      </button>
    </div>
  );
};

export default SlimSummaryHeader;
