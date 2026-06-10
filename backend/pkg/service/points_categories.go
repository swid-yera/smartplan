package service

import "encoding/json"

const violationsAndPenaltiesCategoryKey = "violations_and_penalties"

func decodePointsByCategories(raw []byte) (map[string]int32, error) {
	if len(raw) == 0 {
		return map[string]int32{}, nil
	}

	var decoded map[string]int32
	if err := json.Unmarshal(raw, &decoded); err != nil {
		return nil, err
	}
	if decoded == nil {
		return map[string]int32{}, nil
	}

	return decoded, nil
}

func sumPointsByCategories(pointsByCategories map[string]int32) int32 {
	total := int32(0)
	for _, points := range pointsByCategories {
		total += points
	}
	return total
}
