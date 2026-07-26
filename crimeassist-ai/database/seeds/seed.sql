-- =============================================================================
-- CrimeAssist AI — Seed Data
-- Karnataka State Police (KSP) Crime Investigation System
-- =============================================================================
-- Default password for all demo users: password
-- Bcryptjs hash (10 rounds): $2a$10$j91npNibJTGRQhx9KWmxb.7VCIAmvMXjvCDr9guVI.WaTE3vULxiS
-- To change passwords, generate a new bcryptjs hash and update the password_hash column.
-- =============================================================================

BEGIN;

-- Use stable UUIDs so downstream references work within this transaction
-- District UUIDs: d0000000-0000-0000-0000-{zero-padded index}
-- Police station UUIDs: f0000000-0000-0000-0000-{zero-padded index}
-- User UUIDs: a0000000-0000-0000-0000-{zero-padded index}

-- =============================================================================
-- 1. DISTRICTS (31 districts of Karnataka)
-- =============================================================================

INSERT INTO districts (id, name, code, headquarters, area_sq_km, population, division, latitude, longitude)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Bagalkot',           'BGK', 'Bagalkot',        6583,  1889752, 'Bagalkot',  16.18000000, 75.69000000),
  ('d0000000-0000-0000-0000-000000000002', 'Ballari',            'BLR', 'Ballari',         4264,  1406184, 'Ballari',   15.14000000, 76.92000000),
  ('d0000000-0000-0000-0000-000000000003', 'Belagavi',           'BLG', 'Belagavi',       13415,  4779677, 'Belagavi',  15.86000000, 74.50000000),
  ('d0000000-0000-0000-0000-000000000004', 'Bengaluru Urban',    'BBU', 'Bengaluru',        741,  9621551, 'Bengaluru', 12.97000000, 77.59000000),
  ('d0000000-0000-0000-0000-000000000005', 'Bengaluru Rural',    'BBR', 'Devanahalli',     2239,   990923, 'Bengaluru', 13.25000000, 77.71000000),
  ('d0000000-0000-0000-0000-000000000006', 'Bidar',              'BDR', 'Bidar',           5448,  1703276, 'Bidar',     17.91000000, 77.33000000),
  ('d0000000-0000-0000-0000-000000000007', 'Chamarajanagar',     'CMR', 'Chamarajanagar',  5101,  1020246, 'Mysuru',    11.92000000, 76.94000000),
  ('d0000000-0000-0000-0000-000000000008', 'Chikkaballapur',     'CKB', 'Chikkaballapur',  4244,  1255110, 'Bengaluru', 13.43000000, 77.73000000),
  ('d0000000-0000-0000-0000-000000000009', 'Chikkamagaluru',     'CMG', 'Chikkamagaluru',  7201,  1137753, 'Mysuru',    13.32000000, 75.78000000),
  ('d0000000-0000-0000-0000-000000000010', 'Chitradurga',        'CTR', 'Chitradurga',     8440,  1659456, 'Belagavi',  14.23000000, 76.40000000),
  ('d0000000-0000-0000-0000-000000000011', 'Dakshina Kannada',   'DKM', 'Mangaluru',       4560,  2104693, 'Mysuru',    12.87000000, 74.88000000),
  ('d0000000-0000-0000-0000-000000000012', 'Davanagere',         'DVG', 'Davanagere',      6196,  1003046, 'Belagavi',  14.47000000, 75.92000000),
  ('d0000000-0000-0000-0000-000000000013', 'Dharwad',            'DWD', 'Dharwad',         4265,  1847023, 'Belagavi',  15.46000000, 75.01000000),
  ('d0000000-0000-0000-0000-000000000014', 'Gadag',              'GDG', 'Gadag',           4656,  1064571, 'Belagavi',  15.42000000, 75.63000000),
  ('d0000000-0000-0000-0000-000000000015', 'Hassan',             'HSN', 'Hassan',          6814,  1776422, 'Mysuru',    13.01000000, 76.10000000),
  ('d0000000-0000-0000-0000-000000000016', 'Haveri',             'HVR', 'Haveri',          4786,  1597668, 'Belagavi',  14.80000000, 75.40000000),
  ('d0000000-0000-0000-0000-000000000017', 'Kalaburagi',         'KLG', 'Kalaburagi',     10951,  2566326, 'Kalaburagi',17.33000000, 76.83000000),
  ('d0000000-0000-0000-0000-000000000018', 'Kodagu',             'KDG', 'Madikeri',        4102,   545322, 'Mysuru',    12.42000000, 75.74000000),
  ('d0000000-0000-0000-0000-000000000019', 'Kolar',              'KLR', 'Kolar',           4012,  1536401, 'Bengaluru', 13.14000000, 78.13000000),
  ('d0000000-0000-0000-0000-000000000020', 'Koppal',             'KPL', 'Koppal',          5570,  1389920, 'Belagavi',  15.35000000, 76.15000000),
  ('d0000000-0000-0000-0000-000000000021', 'Mandya',             'MND', 'Mandya',          4961,  1805764, 'Mysuru',    12.52000000, 76.90000000),
  ('d0000000-0000-0000-0000-000000000022', 'Mysuru',             'MYS', 'Mysuru',          6268,  3001127, 'Mysuru',    12.30000000, 76.66000000),
  ('d0000000-0000-0000-0000-000000000023', 'Raichur',            'RCR', 'Raichur',         6826,  1928812, 'Kalaburagi',16.21000000, 77.37000000),
  ('d0000000-0000-0000-0000-000000000024', 'Ramanagara',         'RMR', 'Ramanagara',      3548,  1102147, 'Bengaluru', 12.72000000, 77.28000000),
  ('d0000000-0000-0000-0000-000000000025', 'Shivamogga',         'SMG', 'Shivamogga',      8477,  1752704, 'Belagavi',  13.93000000, 75.57000000),
  ('d0000000-0000-0000-0000-000000000026', 'Tumakuru',           'TMR', 'Tumakuru',       10597,  2678980, 'Bengaluru', 13.34000000, 77.10000000),
  ('d0000000-0000-0000-0000-000000000027', 'Udupi',              'UDP', 'Udupi',           3880,  1177361, 'Mysuru',    13.34000000, 74.75000000),
  ('d0000000-0000-0000-0000-000000000028', 'Uttara Kannada',     'UKA', 'Karwar',         10291,  1437169, 'Belagavi',  14.81000000, 74.13000000),
  ('d0000000-0000-0000-0000-000000000029', 'Vijayapura',         'VJP', 'Vijayapura',     10498,  2177331, 'Kalaburagi',16.83000000, 75.71000000),
  ('d0000000-0000-0000-0000-000000000030', 'Yadgir',             'YDR', 'Yadgir',          5273,  1196271, 'Kalaburagi',16.77000000, 77.14000000),
  ('d0000000-0000-0000-0000-000000000031', 'Vijayanagara',       'VJN', 'Hosapete',        5640,  1353690, 'Ballari',   15.27000000, 76.47000000)
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- 2. POLICE STATIONS (2-3 per district, 90+ total)
-- =============================================================================

INSERT INTO police_stations (id, district_id, name, code, address, phone, latitude, longitude, jurisdiction_area, established_year)
VALUES
  -- Bagalkot (d...01)
  ('f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Bagalkot Town Police Station',      'BGK-TWN-001', 'Station Road, Bagalkot',           '08354-235100', 16.18000000, 75.69000000, 'Bagalkot Town',        1952),
  ('f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'Bagalkot Rural Police Station',      'BGK-RL-002',  'Hunasagi Road, Bagalkot',          '08354-235101', 16.19000000, 75.70000000, 'Bagalkot Rural',       1960),
  ('f0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'Bilagi Police Station',              'BGK-BLG-003', 'Bilagi, Bagalkot',                 '08354-236200', 16.34000000, 75.78000000, 'Bilagi Taluk',         1965),

  -- Ballari (d...02)
  ('f0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 'Ballari Town Police Station',        'BLR-TWN-001', 'KCP Road, Ballari',                '08392-230100', 15.14000000, 76.92000000, 'Ballari Town',         1947),
  ('f0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002', 'Ballari Rural Police Station',       'BLR-RL-002',  'Hospet Road, Ballari',             '08392-230101', 15.15000000, 76.93000000, 'Ballari Rural',        1955),

  -- Belagavi (d...03)
  ('f0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000003', 'Belagavi City Police Station',       'BLG-CIT-001', 'Tilakwadi, Belagavi',              '0831-2420100', 15.86000000, 74.50000000, 'Belagavi City',        1901),
  ('f0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000003', 'Belagavi Camp Police Station',       'BLG-CMP-002', 'Military Camp Area, Belagavi',      '0831-2420101', 15.85000000, 74.51000000, 'Camp Area',            1910),
  ('f0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000003', 'Sadar Bazaar Police Station',        'BLG-SDB-003', 'Sadar Bazaar, Belagavi',           '0831-2420102', 15.87000000, 74.49000000, 'Sadar Bazaar',         1948),

  -- Bengaluru Urban (d...04)
  ('f0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000004', 'Central Town Police Station',        'BBU-CTL-001', 'Tasker Town, Bengaluru',            '080-22210100', 12.97000000, 77.59000000, 'Central Bengaluru',    1860),
  ('f0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000004', 'Koramangala Police Station',         'BBU-KMG-002', '80 Feet Road, Koramangala',        '080-22210200', 12.93500000, 77.62400000, 'Koramangala',          1975),
  ('f0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000004', 'Whitefield Police Station',          'BBU-WHT-003', 'Whitefield Main Road, Bengaluru',   '080-22210300', 12.96980000, 77.75000000, 'Whitefield',           1965),

  -- Bengaluru Rural (d...05)
  ('f0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000005', 'Devanahalli Police Station',         'BBR-DVN-001', 'Devanahalli Town, Bengaluru Rural', '080-27680100', 13.25000000, 77.71000000, 'Devanahalli',          1950),
  ('f0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000005', 'Nelamangala Police Station',         'BBR-NLM-002', 'Nelamangala Town, Bengaluru Rural', '080-27680200', 13.10000000, 77.37000000, 'Nelamangala',          1955),

  -- Bidar (d...06)
  ('f0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000006', 'Bidar Town Police Station',          'BDR-TWN-001', 'Station Road, Bidar',              '08482-220100', 17.91000000, 77.33000000, 'Bidar Town',           1947),
  ('f0000000-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000006', 'Bidar Rural Police Station',         'BDR-RL-002',  'Gulbarga Road, Bidar',             '08482-220101', 17.92000000, 77.34000000, 'Bidar Rural',          1958),

  -- Chamarajanagar (d...07)
  ('f0000000-0000-0000-0000-000000000016', 'd0000000-0000-0000-0000-000000000007', 'Chamarajanagar Town Police Station', 'CMR-TWN-001', 'BMM Road, Chamarajanagar',         '08226-220100', 11.92000000, 76.94000000, 'Chamarajanagar Town',  1952),
  ('f0000000-0000-0000-0000-000000000017', 'd0000000-0000-0000-0000-000000000007', 'Gundlupet Police Station',           'CMR-GND-002', 'Gundlupet, Chamarajanagar',        '08226-226200', 11.81000000, 76.69000000, 'Gundlupet Taluk',      1960),

  -- Chikkaballapur (d...08)
  ('f0000000-0000-0000-0000-000000000018', 'd0000000-0000-0000-0000-000000000008', 'Chikkaballapur Town Police Station', 'CKB-TWN-001', 'Boidpalya Road, Chikkaballapur',   '08156-220100', 13.43000000, 77.73000000, 'Chikkaballapur Town',  1955),
  ('f0000000-0000-0000-0000-000000000019', 'd0000000-0000-0000-0000-000000000008', 'Chintamani Police Station',          'CKB-CHT-002', 'Chintamani, Chikkaballapur',       '08156-225200', 13.40000000, 78.05000000, 'Chintamani Taluk',     1960),

  -- Chikkamagaluru (d...09)
  ('f0000000-0000-0000-0000-000000000020', 'd0000000-0000-0000-0000-000000000009', 'Chikkamagaluru Town Police Station', 'CMG-TWN-001', 'Lady Curzon Road, Chikkamagaluru', '08262-220100', 13.32000000, 75.78000000, 'Chikkamagaluru Town',  1948),
  ('f0000000-0000-0000-0000-000000000021', 'd0000000-0000-0000-0000-000000000009', 'Kadur Police Station',               'CMG-KDR-002', 'Kadur, Chikkamagaluru',            '08262-225200', 13.55000000, 76.01000000, 'Kadur Taluk',          1955),

  -- Chitradurga (d...10)
  ('f0000000-0000-0000-0000-000000000022', 'd0000000-0000-0000-0000-000000000010', 'Chitradurga Town Police Station',    'CTR-TWN-001', 'Fort Road, Chitradurga',           '08194-220100', 14.23000000, 76.40000000, 'Chitradurga Town',     1947),
  ('f0000000-0000-0000-0000-000000000023', 'd0000000-0000-0000-0000-000000000010', 'Hosadurga Police Station',           'CTR-HSD-002', 'Hosadurga, Chitradurga',           '08194-226200', 14.79000000, 76.38000000, 'Hosadurga Taluk',      1958),

  -- Dakshina Kannada (d...11)
  ('f0000000-0000-0000-0000-000000000024', 'd0000000-0000-0000-0000-000000000011', 'Mangaluru City Police Station',      'DKM-CIT-001', 'Hampankatta, Mangaluru',           '0824-2220100', 12.87000000, 74.88000000, 'Mangaluru City',       1890),
  ('f0000000-0000-0000-0000-000000000025', 'd0000000-0000-0000-0000-000000000011', 'Mangaluru Rural Police Station',     'DKM-RL-002',  'Kankanady, Mangaluru',             '0824-2220101', 12.88000000, 74.89000000, 'Mangaluru Rural',      1955),
  ('f0000000-0000-0000-0000-000000000026', 'd0000000-0000-0000-0000-000000000011', 'Puttur Police Station',              'DKM-PUT-003', 'Puttur, Dakshina Kannada',         '08251-220100', 12.76000000, 75.23000000, 'Puttur Taluk',         1948),

  -- Davanagere (d...12)
  ('f0000000-0000-0000-0000-000000000027', 'd0000000-0000-0000-0000-000000000012', 'Davanagere Town Police Station',     'DVG-TWN-001', 'Bank Road, Davanagere',            '08192-220100', 14.47000000, 75.92000000, 'Davanagere Town',      1947),
  ('f0000000-0000-0000-0000-000000000028', 'd0000000-0000-0000-0000-000000000012', 'Davanagere Rural Police Station',    'DVG-RL-002',  'Harapanahalli Road, Davanagere',   '08192-220101', 14.48000000, 75.93000000, 'Davanagere Rural',     1960),

  -- Dharwad (d...13)
  ('f0000000-0000-0000-0000-000000000029', 'd0000000-0000-0000-0000-000000000013', 'Dharwad City Police Station',        'DWD-CIT-001', 'Lamington Road, Dharwad',          '0836-2200100', 15.46000000, 75.01000000, 'Dharwad City',         1901),
  ('f0000000-0000-0000-0000-000000000030', 'd0000000-0000-0000-0000-000000000013', 'Dharwad Rural Police Station',       'DWD-RL-002',  'Narrow Road, Dharwad',             '0836-2200101', 15.47000000, 75.02000000, 'Dharwad Rural',        1955),

  -- Gadag (d...14)
  ('f0000000-0000-0000-0000-000000000031', 'd0000000-0000-0000-0000-000000000014', 'Gadag Town Police Station',          'GDG-TWN-001', 'B.D.A. Complex, Gadag',            '08372-220100', 15.42000000, 75.63000000, 'Gadag Town',           1950),
  ('f0000000-0000-0000-0000-000000000032', 'd0000000-0000-0000-0000-000000000014', 'Ron Police Station',                 'GDG-RON-002', 'Ron, Gadag',                       '08372-226200', 15.68000000, 75.74000000, 'Ron Taluk',            1958),

  -- Hassan (d...15)
  ('f0000000-0000-0000-0000-000000000033', 'd0000000-0000-0000-0000-000000000015', 'Hassan Town Police Station',         'HSN-TWN-001', 'Bangalore Road, Hassan',           '08172-220100', 13.01000000, 76.10000000, 'Hassan Town',          1947),
  ('f0000000-0000-0000-0000-000000000034', 'd0000000-0000-0000-0000-000000000015', 'Arsikere Police Station',            'HSN-ARS-002', 'Arsikere, Hassan',                 '08172-225200', 13.31000000, 76.26000000, 'Arsikere Taluk',       1955),

  -- Haveri (d...16)
  ('f0000000-0000-0000-0000-000000000035', 'd0000000-0000-0000-0000-000000000016', 'Haveri Town Police Station',         'HVR-TWN-001', 'Sankeshwar Road, Haveri',          '08187-220100', 14.80000000, 75.40000000, 'Haveri Town',          1952),
  ('f0000000-0000-0000-0000-000000000036', 'd0000000-0000-0000-0000-000000000016', 'Harihar Police Station',             'HVR-HRI-002', 'Harihar, Haveri',                  '08187-225200', 14.51000000, 75.80000000, 'Harihar Taluk',        1958),

  -- Kalaburagi (d...17)
  ('f0000000-0000-0000-0000-000000000037', 'd0000000-0000-0000-0000-000000000017', 'Kalaburagi Town Police Station',     'KLG-TWN-001', 'Station Road, Kalaburagi',         '08472-220100', 17.33000000, 76.83000000, 'Kalaburagi Town',      1947),
  ('f0000000-0000-0000-0000-000000000038', 'd0000000-0000-0000-0000-000000000017', 'Kalaburagi Rural Police Station',    'KLG-RL-002',  'Sedam Road, Kalaburagi',           '08472-220101', 17.34000000, 76.84000000, 'Kalaburagi Rural',     1955),

  -- Kodagu (d...18)
  ('f0000000-0000-0000-0000-000000000039', 'd0000000-0000-0000-0000-000000000018', 'Madikeri Town Police Station',       'KDG-MDK-001', 'Madikeri Town, Kodagu',            '08272-220100', 12.42000000, 75.74000000, 'Madikeri Town',        1948),
  ('f0000000-0000-0000-0000-000000000040', 'd0000000-0000-0000-0000-000000000018', 'Virajpet Police Station',            'KDG-VJP-002', 'Virajpet, Kodagu',                 '08272-225200', 12.19000000, 75.80000000, 'Virajpet Taluk',       1955),

  -- Kolar (d...19)
  ('f0000000-0000-0000-0000-000000000041', 'd0000000-0000-0000-0000-000000000019', 'Kolar Town Police Station',          'KLR-TWN-001', 'Governors Pet, Kolar',             '08152-220100', 13.14000000, 78.13000000, 'Kolar Town',           1947),
  ('f0000000-0000-0000-0000-000000000042', 'd0000000-0000-0000-0000-000000000019', 'Bangarapet Police Station',          'KLR-BGR-002', 'Bangarapet, Kolar',                '08152-225200', 12.99000000, 78.18000000, 'Bangarapet Taluk',     1955),

  -- Koppal (d...20)
  ('f0000000-0000-0000-0000-000000000043', 'd0000000-0000-0000-0000-000000000020', 'Koppal Town Police Station',         'KPL-TWN-001', 'Gangavathi Road, Koppal',          '08539-220100', 15.35000000, 76.15000000, 'Koppal Town',          1950),
  ('f0000000-0000-0000-0000-000000000044', 'd0000000-0000-0000-0000-000000000020', 'Gangavathi Police Station',          'KPL-GNV-002', 'Gangavathi, Koppal',               '08539-225200', 15.43000000, 76.55000000, 'Gangavathi Taluk',     1958),

  -- Mandya (d...21)
  ('f0000000-0000-0000-0000-000000000045', 'd0000000-0000-0000-0000-000000000021', 'Mandya Town Police Station',         'MND-TWN-001', 'Vinayaka Layout, Mandya',          '08232-220100', 12.52000000, 76.90000000, 'Mandya Town',          1947),
  ('f0000000-0000-0000-0000-000000000046', 'd0000000-0000-0000-0000-000000000021', 'Mysuru Road Police Station',         'MND-MRD-002', 'Mandya, Mysuru Road',              '08232-220101', 12.53000000, 76.91000000, 'Mandya Rural',         1960),

  -- Mysuru (d...22)
  ('f0000000-0000-0000-0000-000000000047', 'd0000000-0000-0000-0000-000000000022', 'Mysuru City Police Station',         'MYS-CIT-001', 'Nazbad, Mysuru',                   '0821-2200100', 12.30000000, 76.66000000, 'Mysuru City',          1890),
  ('f0000000-0000-0000-0000-000000000048', 'd0000000-0000-0000-0000-000000000022', 'Vani Vilas Mohalla Police Station',  'MYS-VVM-002', 'Vani Vilas Mohalla, Mysuru',       '0821-2200101', 12.31000000, 76.67000000, 'VV Mohalla',           1955),
  ('f0000000-0000-0000-0000-000000000049', 'd0000000-0000-0000-0000-000000000022', 'Nazarbad Police Station',            'MYS-NZB-003', 'Nazarbad, Mysuru',                 '0821-2200102', 12.29000000, 76.65000000, 'Nazarbad',             1950),

  -- Raichur (d...23)
  ('f0000000-0000-0000-0000-000000000050', 'd0000000-0000-0000-0000-000000000023', 'Raichur Town Police Station',        'RCR-TWN-001', 'Station Road, Raichur',            '08532-220100', 16.21000000, 77.37000000, 'Raichur Town',         1947),
  ('f0000000-0000-0000-0000-000000000051', 'd0000000-0000-0000-0000-000000000023', 'Raichur Rural Police Station',       'RCR-RL-002',  'Yadgir Road, Raichur',             '08532-220101', 16.22000000, 77.38000000, 'Raichur Rural',        1958),

  -- Ramanagara (d...24)
  ('f0000000-0000-0000-0000-000000000052', 'd0000000-0000-0000-0000-000000000024', 'Ramanagara Town Police Station',     'RMR-TWN-001', 'Bangalore-Mysore Road, Ramanagara', '080-27560100', 12.72000000, 77.28000000, 'Ramanagara Town',      1955),
  ('f0000000-0000-0000-0000-000000000053', 'd0000000-0000-0000-0000-000000000024', 'Channapatna Police Station',         'RMR-CHP-002', 'Channapatna, Ramanagara',          '080-27560200', 12.65000000, 77.21000000, 'Channapatna Taluk',    1960),

  -- Shivamogga (d...25)
  ('f0000000-0000-0000-0000-000000000054', 'd0000000-0000-0000-0000-000000000025', 'Shivamogga Town Police Station',     'SMG-TWN-001', 'Gandhi Bazar, Shivamogga',         '08182-220100', 13.93000000, 75.57000000, 'Shivamogga Town',      1947),
  ('f0000000-0000-0000-0000-000000000055', 'd0000000-0000-0000-0000-000000000025', 'Shivamogga Rural Police Station',    'SMG-RL-002',  'Thirthahalli Road, Shivamogga',    '08182-220101', 13.94000000, 75.58000000, 'Shivamogga Rural',     1955),
  ('f0000000-0000-0000-0000-000000000056', 'd0000000-0000-0000-0000-000000000025', 'Sagar Police Station',               'SMG-SGR-003', 'Sagar, Shivamogga',                '08183-225200', 14.17000000, 75.03000000, 'Sagar Taluk',          1952),

  -- Tumakuru (d...26)
  ('f0000000-0000-0000-0000-000000000057', 'd0000000-0000-0000-0000-000000000026', 'Tumakuru Town Police Station',       'TMR-TWN-001', 'B.H. Road, Tumakuru',              '0816-2200100', 13.34000000, 77.10000000, 'Tumakuru Town',        1947),
  ('f0000000-0000-0000-0000-000000000058', 'd0000000-0000-0000-0000-000000000026', 'Tumakuru Rural Police Station',      'TMR-RL-002',  'Madhugiri Road, Tumakuru',         '0816-2200101', 13.35000000, 77.11000000, 'Tumakuru Rural',       1958),

  -- Udupi (d...27)
  ('f0000000-0000-0000-0000-000000000059', 'd0000000-0000-0000-0000-000000000027', 'Udupi Town Police Station',          'UDP-TWN-001', 'Car Street, Udupi',                '0820-220100', 13.34000000, 74.75000000, 'Udupi Town',           1950),
  ('f0000000-0000-0000-0000-000000000060', 'd0000000-0000-0000-0000-000000000027', 'Manipal Police Station',             'UDP-MNP-002', 'Manipal, Udupi',                   '0820-220101', 13.35000000, 74.79000000, 'Manipal',              1965),

  -- Uttara Kannada (d...28)
  ('f0000000-0000-0000-0000-000000000061', 'd0000000-0000-0000-0000-000000000028', 'Karwar Town Police Station',         'UKA-TWN-001', 'Rajapur Road, Karwar',             '08382-220100', 14.81000000, 74.13000000, 'Karwar Town',          1948),
  ('f0000000-0000-0000-0000-000000000062', 'd0000000-0000-0000-0000-000000000028', 'Sirsi Police Station',               'UKA-SRS-002', 'Sirsi, Uttara Kannada',            '08389-225200', 14.62000000, 74.84000000, 'Sirsi Taluk',          1955),

  -- Vijayapura (d...29)
  ('f0000000-0000-0000-0000-000000000063', 'd0000000-0000-0000-0000-000000000029', 'Vijayapura Town Police Station',     'VJP-TWN-001', 'Gandhi Gunj, Vijayapura',          '08352-220100', 16.83000000, 75.71000000, 'Vijayapura Town',      1947),
  ('f0000000-0000-0000-0000-000000000064', 'd0000000-0000-0000-0000-000000000029', 'Vijayapura Rural Police Station',    'VJP-RL-002',  'Indi Road, Vijayapura',            '08352-220101', 16.84000000, 75.72000000, 'Vijayapura Rural',     1955),

  -- Yadgir (d...30)
  ('f0000000-0000-0000-0000-000000000065', 'd0000000-0000-0000-0000-000000000030', 'Yadgir Town Police Station',         'YDR-TWN-001', 'Station Road, Yadgir',             '08473-220100', 16.77000000, 77.14000000, 'Yadgir Town',          1950),
  ('f0000000-0000-0000-0000-000000000066', 'd0000000-0000-0000-0000-000000000030', 'Shahpur Police Station',             'YDR-SHP-002', 'Shahpur, Yadgir',                  '08473-225200', 16.63000000, 76.84000000, 'Shahpur Taluk',        1958),

  -- Vijayanagara (d...31)
  ('f0000000-0000-0000-0000-000000000067', 'd0000000-0000-0000-0000-000000000031', 'Hosapete Town Police Station',       'VJN-HSP-001', 'Hospet Town, Vijayanagara',        '08394-220100', 15.27000000, 76.47000000, 'Hosapete Town',        1947),
  ('f0000000-0000-0000-0000-000000000068', 'd0000000-0000-0000-0000-000000000031', 'Hospet Rural Police Station',        'VJN-HSR-002', 'Kamalapura, Vijayanagara',         '08394-220101', 15.28000000, 76.48000000, 'Hospet Rural',         1960)
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- 3. USERS (Admin + 4 demo users)
-- =============================================================================
-- Password for all users: password
-- Bcryptjs hash: $2a$10$j91npNibJTGRQhx9KWmxb.7VCIAmvMXjvCDr9guVI.WaTE3vULxiS
-- =============================================================================

INSERT INTO users (id, badge_number, username, email, password_hash, full_name, role, status, district_id, station_id, rank, phone)
VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    'KSP-0001',
    'admin',
    'admin@ksp.gov.in',
    '$2a$10$j91npNibJTGRQhx9KWmxb.7VCIAmvMXjvCDr9guVI.WaTE3vULxiS',
    'Rajesh Kumar Sharma',
    'administrator',
    'active',
    'd0000000-0000-0000-0000-000000000004', -- Bengaluru Urban
    'f0000000-0000-0000-0000-000000000009', -- Central Town PS
    'Additional Director General of Police',
    '080-22210001'
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'KSP-1001',
    'officer',
    'officer@ksp.gov.in',
    '$2a$10$j91npNibJTGRQhx9KWmxb.7VCIAmvMXjvCDr9guVI.WaTE3vULxiS',
    'Suresh Babu N',
    'police_officer',
    'active',
    'd0000000-0000-0000-0000-000000000004', -- Bengaluru Urban
    'f0000000-0000-0000-0000-000000000010', -- Koramangala PS
    'Inspector of Police',
    '080-22210201'
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    'KSP-2001',
    'investigator',
    'investigator@ksp.gov.in',
    '$2a$10$j91npNibJTGRQhx9KWmxb.7VCIAmvMXjvCDr9guVI.WaTE3vULxiS',
    'Priya M Patel',
    'investigation_officer',
    'active',
    'd0000000-0000-0000-0000-000000000022', -- Mysuru
    'f0000000-0000-0000-0000-000000000047', -- Mysuru City PS
    'Deputy Superintendent of Police',
    '0821-2200101'
  ),
  (
    'a0000000-0000-0000-0000-000000000004',
    'KSP-3001',
    'analyst',
    'analyst@ksp.gov.in',
    '$2a$10$j91npNibJTGRQhx9KWmxb.7VCIAmvMXjvCDr9guVI.WaTE3vULxiS',
    'Arjun Reddy K',
    'crime_analyst',
    'active',
    'd0000000-0000-0000-0000-000000000004', -- Bengaluru Urban
    'f0000000-0000-0000-0000-000000000011', -- Whitefield PS
    'Crime Analyst',
    '080-22210301'
  )
ON CONFLICT (badge_number) DO NOTHING;

COMMIT;
