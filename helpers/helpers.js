module.exports = {
    escapeRegExp: function(stringToGoIntoTheRegex) {
        return stringToGoIntoTheRegex.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    },

    isEmpty: function(obj) {
        const isNullish = Object.values(obj).some(value => {
            if (value === null || value === undefined) {
                return true;
            }
            
            return false;
        });
    
        return isNullish;
    }
}