const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Returns a start and end UTC Date for a given 'YYYY-MM' string
 */
function getMonthDateRange(filterMonth) {
  if (!filterMonth || !/^\d{4}-\d{2}$/.test(filterMonth)) return null;
  const [year, m] = filterMonth.split('-').map(Number);
  const startDate = new Date(Date.UTC(year, m - 1, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, m, 1, 0, 0, 0, 0));
  return { startDate, endDate, year, month: m, monthPadded: String(m).padStart(2, '0') };
}

/**
 * Returns distinct YYYY-MM dates that exist in the collection
 */
async function getAvailableDates(Model, dateField = 'createdAt') {
  try {
    const groups = await Model.aggregate([
      { $match: { [dateField]: { $exists: true, $ne: null } } },
      {
        $project: {
          ym: {
            $dateToString: {
              format: '%Y-%m',
              date: {
                $convert: {
                  input: `$${dateField}`,
                  to: 'date',
                  onError: null,
                  onNull: null
                }
              }
            }
          }
        }
      },
      { $group: { _id: '$ym' } },
      { $sort: { _id: -1 } }
    ]);

    return groups
      .filter(g => g._id && /^\d{4}-\d{2}$/.test(g._id))
      .map(g => {
        const [year, month] = g._id.split('-').map(Number);
        return {
          value: g._id,
          label: `${monthNames[month - 1]} ${year}`
        };
      });
  } catch (err) {
    console.error('Error fetching available dates:', err.message);
    return [];
  }
}

module.exports = {
  monthNames,
  getMonthDateRange,
  getAvailableDates
};
