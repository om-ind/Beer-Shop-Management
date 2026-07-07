export default function ProductSearch({
    keyword,
    onSearch
}) {

    return (

        <input
            type="text"
            value={keyword}
            onChange={onSearch}
            placeholder="Search Product or Scan Barcode"
            className="w-full border rounded-lg p-3 mb-5"
        />

    );

}