import React, { useCallback, useEffect, useRef, useState } from 'react'
import styles from './styles.module.css'
import { ReactComponent as ClockIcon } from './clock.svg'
import { ReactComponent as NightIcon } from './night.svg'
import { ReactComponent as DayIcon } from './day.svg'

const TimePickerCallout = ({
  hours,
  minutes,
  seconds,
  setHours,
  setMinutes,
  setSeconds,
  isOpen,
  parentComponent,
  placeholders,
  setOpen,
  showSeconds,
  handleChange
}) => {
  const componentRef = useRef()
  const [top, setTop] = useState(0)
  const [left, setLeft] = useState(0)
  const [resize, setResize] = useState(true)
  const hourLabels = [
    '07',
    '08',
    '09',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
    '20',
    '21',
    '22',
    '23',
    '00',
    '01',
    '02',
    '03',
    '04',
    '05',
    '06'
  ]
  const tensLabels = ['00', '10', '20', '30', '40', '50']
  const onesLabels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

  // Check resize and update callout if needed
  useEffect(() => {
    function resize() {
      setResize((prev) => !prev)
    }
    if (isOpen) {
      window.addEventListener('resize', resize)
      return () => {
        window.removeEventListener('resize', resize)
      }
    }
  }, [isOpen])

  // Click away listener
  useEffect(() => {
    function clickAway(evt) {
      if (parentComponent && !parentComponent.current.contains(evt.target)) {
        setOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('click', clickAway)
    }
    return () => {
      document.removeEventListener('click', clickAway)
    }
  }, [isOpen, setOpen, parentComponent])

  // Calculate callout position
  useEffect(() => {
    if (isOpen && componentRef.current && parentComponent.current) {
      // position below
      const parentRect = parentComponent.current.getBoundingClientRect()
      const componentRect = componentRef.current.getBoundingClientRect()
      const top = parentRect.y + parentRect.height + 1 + window.pageYOffset
      const left =
        parentRect.x +
        parentRect.width / 2 -
        componentRect.width / 2 +
        window.pageXOffset
      setTop(top)
      setLeft(left)
    }
  }, [isOpen, setOpen, parentComponent, componentRef, resize])

  const checkSelected = useCallback(
    (val, type) => {
      let compare = null
      let value = val
      if (type === 'hours') compare = hours
      else if (type === 'minutes') {
        compare = minutes.length > 0 ? minutes[0] : null
        value = val[0]
      } else if (type === 'minutes-ones') {
        compare = minutes.length > 1 ? minutes[1] : null
        value = val
      } else if (type === 'seconds') {
        compare = seconds.length > 0 ? seconds[0] : null
        value = val[0]
      } else if (type === 'seconds-ones') {
        compare = seconds.length > 1 ? seconds[1] : null
        value = val
      }

      if (compare === value) return styles.calloutSelected
      return ''
    },
    [hours, minutes, seconds]
  )

  const handleClick = (val, type) => (evt) => {
    evt.preventDefault()
    if (type === 'hours') {
      setHours(val)
      handleChange(val, minutes, seconds)
    } else if (type === 'minutes') {
      if (!minutes) {
        setMinutes(val)
        handleChange(hours, val, seconds)
      } else {
        setMinutes((prev) => {
          handleChange(hours, `${val[0]}${prev[1]}`, seconds)
          return `${val[0]}${prev[1]}`
        })
      }
    } else if (type === 'minutes-ones') {
      if (!minutes) {
        setMinutes(`0${val}`)
        handleChange(hours, `0${val}`, seconds)
      } else {
        setMinutes((prev) => {
          handleChange(hours, `${prev[0]}${val}`, seconds)
          return `${prev[0]}${val}`
        })
      }
    } else if (type === 'seconds') {
      if (!seconds) {
        setSeconds(val)
        handleChange(hours, minutes, val)
      } else {
        setSeconds((prev) => {
          handleChange(hours, minutes, `${val[0]}${prev[1]}`)
          return `${val[0]}${prev[1]}`
        })
      }
    } else if (type === 'seconds-ones') {
      if (!seconds) {
        setSeconds(`0${val}`)
        handleChange(hours, minutes, `0${val}`)
      } else {
        setSeconds((prev) => {
          handleChange(hours, minutes, `${prev[0]}${val}`)
          return `${prev[0]}${val}`
        })
      }
    }
  }

  const handleKeyDown = (evt) => {
    // Get info about the cell, row, table, nextTable, prevTable
    function getInfo(elem) {
      const result = {
        element: elem,
        cell: null,
        cellIndex: null,
        row: null,
        rowIndex: null,
        table: null,
        nextTable: null,
        prevTable: null
      }
      result.cell = result.element
      while (result.cell?.tagName?.toLowerCase() !== 'td') {
        result.cell = result.cell.parentElement
        if (result.cell === null) return null
      }
      result.cellIndex = result.cell.cellIndex
      result.row = result.cell
      while (result.row?.tagName?.toLowerCase() !== 'tr') {
        result.row = result.row.parentElement
        if (result.row === null) return null
      }
      result.rowIndex = result.row.rowIndex
      result.table = result.row
      while (result.table?.tagName?.toLowerCase() !== 'table') {
        result.table = result.table.parentElement
        if (result.table === null) return null
      }
      const tables = Array.from(
        componentRef.current.querySelectorAll('table')
      ).filter((table) => {
        const button = table.rows[0].cells[1]?.querySelector('button')
        return button && !button.disabled
      })
      const curIndex = tables.indexOf(result.table)
      // Find the next table
      if (curIndex < tables.length - 1) {
        result.nextTable = tables[curIndex + 1]
      } else {
        result.nextTable = tables[0]
      }
      // Find the previous table
      if (curIndex === 0) {
        result.prevTable = tables[tables.length - 1]
      } else {
        result.prevTable = tables[curIndex - 1]
      }
      return result
    }
    function nextSelectableCell(row, from = 0) {
      let idx = from
      while (row.cells[idx]?.dataset?.iconcell) {
        idx += 1
      }
      return row.cells[idx]
    }
    function prevSelectableCell(row, from = 0) {
      let idx = from - 1
      while (row.cells[idx]?.dataset?.iconcell && idx >= 0) {
        idx -= 1
      }
      if (idx < 0) return null
      return row.cells[idx]
    }
    // get the index of a cell if going from rowFrom to rowTo
    function cellToIdx(rowFrom, rowTo, idxFrom = 0) {
      if (!rowFrom || !rowTo) return null
      const offsetFrom = rowFrom.cells[0]?.dataset.iconcell ? 1 : 0
      const cellsFrom = Array.from(rowFrom.cells)?.filter(
        (c) => !c.dataset.iconcell
      ).length
      const offsetTo = rowTo.cells[0].dataset.iconcell ? 1 : 0
      const cellsTo = Array.from(rowTo.cells)?.filter(
        (c) => !c.dataset.iconcell
      ).length
      if (cellsFrom && cellsTo) {
        return (
          Math.round(((idxFrom - offsetFrom + 1) * cellsTo) / cellsFrom) -
          1 +
          offsetTo
        )
      }
      return rowTo.cells.length - 1
    }
    // 39 - right
    // 40 - down
    // 37 - left
    // 38 - up
    const key = evt.which
    if (key === 39 || key === 40 || key === 37 || key === 38 || key === 9) {
      evt.preventDefault()
      if (evt.target.tagName.toLowerCase() !== 'button') {
        // just select first button
        const button = evt.target?.querySelector('td button')
        return button && button.focus()
      }
      const info = getInfo(evt.target)
      if (info !== null) {
        // press right arrow
        if (key === 39) {
          // if possible just focus the next element
          if (info.cellIndex < info.row.cells.length - 1) {
            const button = info.row.cells[info.cellIndex + 1].querySelector(
              'button'
            )
            if (button) return button.focus()
          } else {
            // we are at the last cell of the row
            // check if there are rows below
            if (
              info.rowIndex < info.table.rows.length - 1 &&
              info.table.rows[info.rowIndex + 1]?.dataset?.hasnonells !== true
            ) {
              // if yes, just select the first selectable cell of the next row
              const button = nextSelectableCell(
                info.table.rows[info.rowIndex + 1]
              )?.querySelector('button')
              if (button) return button.focus()
            } else {
              // if not, just go to the first row
              const button = nextSelectableCell(
                info.table.rows[0]
              )?.querySelector('button')
              if (button) return button.focus()
            }
          }
        } else if (key === 37) {
          // press left arrow
          // if possible, just focus prev selectable cell
          const prevSelectable = prevSelectableCell(info.row, info.cellIndex)
          if (prevSelectable) {
            const button = prevSelectable?.querySelector('button')
            return button && button.focus()
          } else {
            // there is no previous selectable cell
            // check if there is a row above
            if (info.rowIndex > 0) {
              const prevRow = info.table.rows[info.rowIndex - 1]
              const button = prevRow.cells[
                prevRow.cells.length - 1
              ]?.querySelector('button')
              return button && button.focus()
            } else {
              // select last cell of the last row
              let lastRow = info.table.rows[info.table.rows.length - 1]
              if (lastRow.dataset.hasnonells === true) lastRow = info.row
              const button = lastRow.cells[
                lastRow.cells.length - 1
              ]?.querySelector('button')
              return button && button.focus()
            }
          }
        } else if (key === 40) {
          // down we go
          // if i have rows beneath, and they have cells
          const validRows = Array.from(info.table.rows).filter(
            (row) => row.cells.length > 1
          )
          if (info.rowIndex < validRows.length - 1) {
            // select the cell below, keeping the ratio
            const rowTo = info.table.rows[info.rowIndex + 1]
            const idxTo = cellToIdx(info.row, rowTo, info.cellIndex)
            const button =
              idxTo > -1 && rowTo.cells[idxTo]?.querySelector('button')
            return button && button.focus()
          } else {
            // if not, select a cell in the first row of the next table, keeping the ratio
            const rowTo = info.nextTable.rows[0]
            const idxTo = cellToIdx(info.row, rowTo, info.cellIndex)
            const button =
              idxTo > -1 && rowTo.cells[idxTo]?.querySelector('button')
            return button && button.focus()
          }
        } else if (key === 38) {
          // we go up
          // if i have rows above, and they have cells
          if (info.rowIndex !== 0) {
            // select the cell above, keeping the ration
            const rowTo = info.table.rows[info.rowIndex - 1]
            const idxTo = cellToIdx(info.row, rowTo, info.cellIndex)
            const button =
              idxTo > -1 && rowTo.cells[idxTo]?.querySelector('button')
            return button && button.focus()
          } else {
            // if not, select a cell in the last row of the prev table
            const validRows = Array.from(info.prevTable.rows).filter(
              (row) => row.cells.length > 1
            )
            const rowTo = validRows[validRows.length - 1]
            const idxTo = cellToIdx(info.row, rowTo, info.cellIndex)
            const button =
              idxTo > -1 && rowTo.cells[idxTo]?.querySelector('button')
            return button && button.focus()
          }
        } else if (key === 9) {
          // if i press tab, i want to go to first selectable cell of the next table
          const rowTo = info.nextTable.rows[0]
          const validCells = Array.from(rowTo.cells).filter(
            (cell) => !!cell.dataset.iconcell !== true
          )
          const button = validCells[0]?.querySelector('button')
          return button && button.focus()
        }
      }
    }
  }

  const handleNow = () => {
    const now = new Date()
    setHours(`0${now.getHours()}`.slice(-2))
    setMinutes(`0${now.getMinutes()}`.slice(-2))
    setSeconds(`0${now.getSeconds()}`.slice(-2))
    handleChange(
      `0${now.getHours()}`,
      `0${now.getMinutes()}`,
      `0${now.getSeconds()}`
    )
  }

  return isOpen ? (
    <div
      ref={componentRef}
      className={styles.calloutRoot}
      style={{
        visibility: top === 0 && left === 0 ? 'hidden' : 'visible',
        top,
        left
      }}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.calloutTime}>
        <ClockIcon className={styles.calloutTimeIcon} />
        <span className={styles.calloutHours}>
          {hours || placeholders.hours}
        </span>
        {' : '}
        <span className={styles.calloutMinutes}>
          {minutes || placeholders.minutes}
        </span>
        {showSeconds && (
          <React.Fragment>
            {' : '}
            <span className={styles.calloutSeconds}>
              {seconds || placeholders.seconds}
            </span>
          </React.Fragment>
        )}
      </div>
      <button
        tabIndex={-1}
        type='button'
        className={styles.calloutNowButton}
        onClick={handleNow}
      >
        Now
      </button>
      <div className={styles.calloutSeparator} />
      <div className={styles.calloutContent}>
        <table>
          <tbody>
            <tr>
              <td data-iconcell rowSpan={2} className={styles.calloutTableIcon}>
                <DayIcon />
              </td>
              {hourLabels.slice(0, 6).map((label) => (
                <td key={label}>
                  <button
                    className={`${styles.calloutPrimaryButton} ${checkSelected(
                      label,
                      'hours'
                    )}`}
                    onClick={handleClick(label, 'hours')}
                    tabIndex={-1}
                  >
                    {label}
                  </button>
                </td>
              ))}
            </tr>
            <tr>
              {hourLabels.slice(6, 12).map((label) => (
                <td key={label}>
                  <button
                    className={`${styles.calloutPrimaryButton} ${checkSelected(
                      label,
                      'hours'
                    )}`}
                    onClick={handleClick(label, 'hours')}
                  >
                    {label}
                  </button>
                </td>
              ))}
            </tr>
            <tr>
              <td data-iconcell rowSpan={2} className={styles.calloutTableIcon}>
                <NightIcon />
              </td>
              {hourLabels.slice(12, 18).map((label) => (
                <td key={label}>
                  <button
                    className={`${styles.calloutPrimaryButton} ${checkSelected(
                      label,
                      'hours'
                    )}`}
                    onClick={handleClick(label, 'hours')}
                  >
                    {label}
                  </button>
                </td>
              ))}
            </tr>
            <tr>
              {hourLabels.slice(18).map((label) => (
                <td key={label}>
                  <button
                    className={`${styles.calloutPrimaryButton} ${checkSelected(
                      label,
                      'hours'
                    )}`}
                    onClick={handleClick(label, 'hours')}
                  >
                    {label}
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        <table>
          <tbody>
            <tr>
              <td data-iconcell rowSpan={2} className={styles.calloutTableIcon}>
                M
              </td>
              {tensLabels.map((label) => (
                <td key={`minutes-${label}`}>
                  <button
                    className={`${styles.calloutPrimaryButton} ${checkSelected(
                      label,
                      'minutes'
                    )}`}
                    onClick={handleClick(label, 'minutes')}
                  >
                    {label}
                  </button>
                </td>
              ))}
            </tr>
            <tr>
              <td data-hasnocells colSpan={6} style={{ border: 'none' }}>
                <table className={styles.calloutTableInner}>
                  <tbody>
                    <tr>
                      {onesLabels.map((label) => (
                        <td key={`minutes-${label}`}>
                          <button
                            disabled={!minutes}
                            className={`${
                              styles.calloutPrimaryButton
                            } ${checkSelected(label, 'minutes-ones')}`}
                            onClick={handleClick(label, 'minutes-ones')}
                          >
                            {label}
                          </button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
        {showSeconds && (
          <table>
            <tbody>
              <tr>
                <td
                  data-iconcell
                  rowSpan={2}
                  className={styles.calloutTableIcon}
                >
                  S
                </td>
                {tensLabels.map((label) => (
                  <td key={`seconds-${label}`}>
                    <button
                      className={`${
                        styles.calloutPrimaryButton
                      } ${checkSelected(label, 'seconds')}`}
                      onClick={handleClick(label, 'seconds')}
                    >
                      {label}
                    </button>
                  </td>
                ))}
              </tr>
              <tr>
                <td data-hasnocells colSpan={6} style={{ border: 'none' }}>
                  <table className={styles.calloutTableInner}>
                    <tbody>
                      <tr>
                        {onesLabels.map((label) => (
                          <td key={`seconds-${label}`}>
                            <button
                              disabled={!seconds}
                              className={`${
                                styles.calloutPrimaryButton
                              } ${checkSelected(label, 'seconds-ones')}`}
                              onClick={handleClick(label, 'seconds-ones')}
                            >
                              {label}
                            </button>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        )}
        <div className={styles.calloutSeparator} />
      </div>
    </div>
  ) : null
}

const TimeInput = ({
  hours,
  setHours,
  minutes,
  setMinutes,
  seconds,
  setSeconds,
  inputStyles,
  showSeconds,
  parentComponent,
  required,
  disabled,
  placeholders,
  handleChange
}) => {
  const hourRef = useRef()
  const minuteRef = useRef()
  const secondRef = useRef()

  const handleHoursChange = (evt) => {
    let val = +evt.target.value
    let h = hours
    if (evt.target.value === '') {
      setHours('')
      return handleChange('', minutes, seconds)
    }
    if (!Number.isNaN(val)) {
      if (evt.target?.value?.length > 2) {
        val = evt.target.value[evt.target.value.length - 1]
        h = ''
      }
      // if value is more than 2, insert a 0 in the front and focus minutes input
      if ((val > 2 && val < 10) || h === '0') {
        setHours(`0${val}`)
        handleChange(`0${val}`, minutes, seconds)
        if (minuteRef.current) {
          minuteRef.current.focus()
          return minuteRef.current?.select()
        }
        return
      }
      if (val >= 0 && val < 24) {
        if ((h === '0' && val === 0) || val > 9) minuteRef.current.focus()
        setHours(String(val))
        handleChange(String(val), minutes, seconds)
      }
    }
  }

  const handleMinutesChange = (evt) => {
    let val = +evt.target.value
    let m = minutes
    if (evt.target.value === '') {
      setMinutes('')
      return handleChange(hours, '', seconds)
    }
    if (!Number.isNaN(val)) {
      if (evt.target?.value?.length > 2) {
        val = evt.target.value[evt.target.value.length - 1]
        m = ''
      }
      if ((val > 5 && val < 10) || m === '0') {
        setMinutes(`0${val}`)
        handleChange(hours, `0${val}`, seconds)
        secondRef.current.focus()
        return secondRef.current?.select()
      }
      if (val >= 0 && val < 60) {
        if ((m === '0' && val === 0) || val > 9) {
          if (secondRef.current) {
            secondRef.current.focus()
            secondRef.current.select()
          }
        }
        setMinutes(String(val))
        handleChange(hours, String(val), seconds)
      }
    }
  }

  const handleSecondsChange = (evt) => {
    let val = +evt.target.value
    let s = seconds
    if (evt.target.value === '') {
      setSeconds('')
      return handleChange(hours, minutes, '')
    }
    if (!Number.isNaN(val)) {
      if (evt.target?.value?.length > 2) {
        val = evt.target.value[evt.target.value.length - 1]
        s = ''
      }
      if ((val > 5 && val < 10) || s === '0') {
        setSeconds(`0${val}`)
        return handleChange(hours, minutes, `0${val}`)
      }
      if (val >= 0 && val < 60) {
        setSeconds(String(val))
        return handleChange(hours, minutes, String(val))
      }
    }
  }

  const handleArrowKey = (nextRef = null, prevRef = null) => (evt) => {
    // 39 - right
    // 37 - left
    const key = evt.which
    const val = evt.target?.value
    const selectionStart = evt.target?.selectionStart
    if (key === 39 && selectionStart === val?.length && nextRef?.current) {
      nextRef.current.focus()
    } else if (key === 37 && selectionStart === 0 && prevRef?.current) {
      prevRef.current.focus()
    } else if (key === 13) {
      evt.preventDefault()
      if (hours && minutes && seconds) {
        if (parentComponent?.current) {
          parentComponent.current.focus()
          parentComponent.current.blur()
        }
      }
    }
  }

  const handleBlur = (setFunc) => (evt) => {
    if (evt.target?.value !== '') {
      const val = +evt.target?.value
      if (!Number.isNaN(val)) {
        if (val < 10) {
          setFunc(`0${val}`)
        }
      }
    }
  }

  return (
    <div className={styles.inputRoot}>
      <div className={styles.inputContainer}>
        <input
          ref={hourRef}
          style={inputStyles?.cell}
          className={styles.inputCell}
          placeholder={placeholders?.hours ?? 'hh'}
          value={hours}
          onChange={handleHoursChange}
          onKeyDown={handleArrowKey(minuteRef)}
          onBlur={handleBlur(setHours)}
          required={required}
          disabled={disabled}
        />
        <span>:</span>
        <input
          ref={minuteRef}
          style={inputStyles?.cell}
          className={styles.inputCell}
          placeholder={placeholders?.minutes ?? 'mm'}
          value={minutes}
          onChange={handleMinutesChange}
          onKeyDown={handleArrowKey(secondRef, hourRef)}
          onBlur={handleBlur(setMinutes)}
          required={required}
          disabled={disabled}
        />
        {showSeconds && (
          <React.Fragment>
            <span>:</span>
            <input
              ref={secondRef}
              style={inputStyles?.cell}
              className={styles.inputCell}
              placeholder={placeholders?.seconds ?? 'ss'}
              value={seconds}
              onChange={handleSecondsChange}
              onKeyDown={handleArrowKey(null, minuteRef)}
              onBlur={handleBlur(setSeconds)}
              required={required}
              disabled={disabled}
            />
          </React.Fragment>
        )}
        <div role='button'>
          <ClockIcon
            className={`${styles.inputIcon} ${
              disabled ? styles.inputDisabled : ''
            }`}
          />
        </div>
      </div>
    </div>
  )
}

/**
 *
 * @param {Object} props
 * @param {Boolean} props.showSeconds
 * @param {{ hours: String, minutes: String, seconds: String }} props.placeholders
 * @param {Object} props.style Style of the root element
 * @param {Object} props.theme theme to override the css variables
 * @param {Date} props.date
 * @param {Function} props.onChange
 * @param {Boolean} props.required
 * @param {Boolean} props.disabled
 * @param {Object} props.TimeInputIcon
 * @param {Object} props.TimeCalloutIcon
 * @param {Object} props.DayCalloutIcon
 * @param {Object} props.NightCalloutIcon
 * @param {Object} props.MinuteCalloutIcon
 * @param {Object} props.SecondCalloutIcon
 */
export const TimePicker = ({
  style,
  showSeconds,
  placeholders = {
    hours: 'hh',
    minutes: 'mm',
    seconds: 'ss'
  },
  theme,
  date,
  onChange,
  required,
  disabled,
  TimeInputIcon,
  TimeCalloutIcon,
  DayCalloutIcon,
  NightCalloutIcon,
  MinuteCalloutIcon,
  SecondCalloutIcon
}) => {
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [seconds, setSeconds] = useState('')
  const [calloutShown, setCalloutShown] = useState(false)
  const [isWithinWindow, setIsWithinWindow] = useState(true)
  const componentRef = useRef()

  // Apply theme
  useEffect(() => {
    const doc = componentRef.current
    // --spacing-s1: 4px;
    if (theme?.spacing?.s1)
      doc.style.setProperty('--spacing-s1', theme.spacing.s1)
    // --spacing-s2: 8px;
    if (theme?.spacing?.s2)
      doc.style.setProperty('--spacing-s2', theme.spacing.s2)
    // --spacing-m: 12px;
    if (theme?.spacing?.m) doc.style.setProperty('--spacing-m', theme.spacing.m)
    // --spacing-l1: 16px;
    if (theme?.spacing?.l1)
      doc.style.setProperty('--spacing-l1', theme.spacing.l1)
    // --spacing-l2: 20px;
    if (theme?.spacing?.l2)
      doc.style.setProperty('--spacing-l2', theme.spacing.l2)
    // --pallete-color-text-primary: rgb(255, 255, 255);
    if (theme?.palette?.textPrimaryColor)
      doc.style.setProperty(
        '--pallete-color-text-primary',
        theme.palette.textPrimaryColor
      )
    // --pallete-color-text-secondary: rgb(117, 117, 117);
    if (theme?.palette?.textSecondaryColor)
      doc.style.setProperty(
        '--pallete-color-text-secondary',
        theme.palette.textSecondaryColor
      )
    // --pallete-color-text-disabled: rgb(185, 185, 185);
    if (theme?.palette?.textDisabledColor)
      doc.style.setProperty(
        '--pallete-color-text-disabled',
        theme.palette.textDisabledColor
      )
    // --pallete-color-primary: rgb(253, 65, 59);
    if (theme?.palette?.primaryColor)
      doc.style.setProperty(
        '--pallete-color-primary',
        theme.palette.primaryColor
      )
    // --pallete-color-secondary: rgb(248, 136, 136);
    if (theme?.palette?.secondaryColor)
      doc.style.setProperty(
        '--pallete-color-secondary',
        theme.palette.secondaryColor
      )
    // --pallete-color-neutral: rgb(110, 110, 110);
    if (theme?.palette?.neutralColor)
      doc.style.setProperty(
        '--pallete-color-neutral',
        theme.palette.neutralColor
      )
    // --pallete-color-neutralAlt: rgb(172, 172, 172);
    if (theme?.palette?.neutralColorAlt)
      doc.style.setProperty(
        '--pallete-color-neutralAlt',
        theme.palette.neutralColorAlt
      )
    // --pallete-color-background-primary: rgb(51, 51, 51);
    if (theme?.palette?.backgroundColorPrimary)
      doc.style.setProperty(
        '--pallete-color-background-primary',
        theme.palette.backgroundColorPrimary
      )
    // --pallete-color-background-disabled: rgb(37, 37, 37);
    if (theme?.palette?.backgroundColorDisabled)
      doc.style.setProperty(
        '--pallete-color-background-disabled',
        theme.palette.backgroundColorDisabled
      )
    // --timepicker-font-size-small: 12px;
    if (theme?.font?.sizeSmall)
      doc.style.setProperty(
        '--timepicker-font-size-small',
        theme.font.sizeSmall
      )
    // --timepicker-font-size-medium: 16px;
    if (theme?.font?.sizeMedium)
      doc.style.setProperty(
        '--timepicker-font-size-medium',
        theme.font.sizeMedium
      )
    // --timepicker-font-family: 'Open Sans Condensed', sans-serif;
    if (theme?.font?.family)
      doc.style.setProperty('--timepicker-font-family', theme.font.family)
  }, [theme])

  const changeCb = useCallback(
    (h, m, s) => {
      if (onChange && !disabled) {
        const copy = new Date()
        if (h !== '') copy.setHours(+h)
        if (m !== '') copy.setMinutes(+m)
        if (s !== '') copy.setSeconds(+s)
        onChange(copy)
      }
    },
    [onChange, disabled]
  )

  useEffect(() => {
    function handleLeave() {
      setIsWithinWindow(false)
    }
    function handleEnter() {
      setIsWithinWindow(true)
    }
    document.addEventListener('mouseleave', handleLeave)
    document.addEventListener('mouseenter', handleEnter)
    return () => {
      document.removeEventListener('mouseleave', handleLeave)
      document.removeEventListener('mouseenter', handleEnter)
    }
  }, [])

  const handleFocusChange = (val) => (evt) => {
    if (isWithinWindow && !disabled) {
      if (
        val === true ||
        !componentRef?.current?.contains(evt?.relatedTarget)
      ) {
        setCalloutShown(val)
      }
    }
  }

  /**
   * On pressign Esc, callout will be closed
   */
  const handleKey = (evt) => {
    const key = evt.which
    if (key === 27) {
      setCalloutShown(false)
    }
  }

  return (
    <div
      ref={componentRef}
      tabIndex={-1}
      role='textbox'
      className={styles.root}
      onFocus={handleFocusChange(true)}
      onBlur={handleFocusChange(false)}
      onKeyDown={handleKey}
      style={style}
    >
      <TimeInput
        hours={hours}
        setHours={setHours}
        minutes={minutes}
        placeholders={placeholders}
        setMinutes={setMinutes}
        seconds={seconds}
        setSeconds={setSeconds}
        parentComponent={componentRef}
        showSeconds={showSeconds}
        required={required}
        disabled={disabled}
        handleChange={changeCb}
      />
      <TimePickerCallout
        hours={hours}
        minutes={minutes}
        seconds={seconds}
        setHours={setHours}
        setMinutes={setMinutes}
        setSeconds={setSeconds}
        isOpen={calloutShown}
        setOpen={setCalloutShown}
        parentComponent={componentRef}
        placeholders={placeholders}
        showSeconds={showSeconds}
        handleChange={changeCb}
      />
    </div>
  )
}
