# Generalist specializations that do NOT qualify a physician as a "specialist"
# for routing purposes. Only physicians with specializations outside this list
# appear on the specialists page and feed into the routing algorithm.
GENERALIST_SPECIALIZATIONS = frozenset({
    "General Practice",
    "Emergency Medicine",
    "Internal Medicine",
    "Surgery (General)",
})
