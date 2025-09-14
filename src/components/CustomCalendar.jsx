import React from 'react';
import { Calendar } from '@/components/ui/calendar';

/**
 * A reusable custom calendar component that highlights specific dates.
 * @param {object} props
 * @param {Date[]} props.highlightedDates - An array of Date objects to highlight.
 * @param {Date} props.selectedDate - The currently selected date.
 * @param {function} props.onSelect - Function to call when a date is selected.
 * @param {string} [props.className] - Optional additional class names.
 */
export const CustomCalendar = ({ highlightedDates, selectedDate, onSelect, className }) => {

  const modifiers = {
    highlighted: highlightedDates || [],
  };

  const modifiersClassNames = {
    highlighted: 'has-event', // Using a more generic name than 'has-shoot'
  };

  return (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={onSelect}
      modifiers={modifiers}
      modifiersClassNames={modifiersClassNames}
      className={className} // Pass through any additional classes
      captionLayout="dropdown"
    />
  );
};
