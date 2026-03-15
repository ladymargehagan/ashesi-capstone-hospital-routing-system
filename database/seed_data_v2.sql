-- ==========================================================================
-- HRS Seed Data v2  —  Greater Accra Region (from cleaned CSV dataset)
-- ==========================================================================
-- Run AFTER HRSdb_v2.sql in PGAdmin
--
-- Login Credentials:
--   Super Admin:     admin@hrs.gov.gh / admin123
--   Hospital Admin:  admin@korlebu.gov.gh / hospital123
--   Physician:       dr.mensah@korlebu.gov.gh / physician123
-- ==========================================================================


-- =========================================================================
-- 1. ROLES
-- =========================================================================
INSERT INTO role (role_name, description) VALUES
    ('super_admin', 'System-wide administrator'),
    ('hospital_admin', 'Hospital administrator'),
    ('physician', 'Referring physician / doctor')
ON CONFLICT (role_name) DO NOTHING;


-- =========================================================================
-- 2. HOSPITALS  —  Greater Accra Region (from cleaned-health-facilities-gh.csv)
-- =========================================================================

-- ── Hospitals ──
INSERT INTO hospitals (name, license_number, gps_coordinates, address, level, type, ownership, status) VALUES
    ('37 Military Hospital', 'GHS-GAR-0001', POINT(5.58704, -0.18391), 'Burma Camp, Accra Metropolitan', 'teaching', 'specialist', 'military', 'active'),
    ('Korle-Bu Teaching Hospital', 'GHS-GAR-0002', POINT(5.53719, -0.2266), 'Korle-bu, Accra Metropolitan', 'teaching', 'teaching', 'public', 'active'),
    ('Ridge Hospital', 'GHS-GAR-0003', POINT(5.56238, -0.1987), 'Ridge, Accra Metropolitan', 'regional', 'regional', 'public', 'active'),
    ('University Hospital (Legon Hospital)', 'GHS-GAR-0004', POINT(5.65141, -0.17794), 'Legon, Accra Metropolitan', 'teaching', 'teaching', 'public', 'active'),
    ('La General Hospital', 'GHS-GAR-0005', POINT(5.55538, -0.16657), 'La, Accra Metropolitan', 'regional', 'regional', 'public', 'active'),
    ('Tema General Hospital', 'GHS-GAR-0006', POINT(5.67387, -0.02496), 'Tema, Tema Metropolitan', 'regional', 'regional', 'public', 'active'),
    ('Achimota Hospital', 'GHS-GAR-0007', POINT(5.62922, -0.21476), 'Atomic, Ga East', 'district', 'district', 'public', 'active'),
    ('Accra Psychiatric Hospital', 'GHS-GAR-0008', POINT(5.56272, -0.20528), 'Adabraka, Accra Metropolitan', 'district', 'specialist', 'public', 'active'),
    ('Pantang Hospital', 'GHS-GAR-0009', POINT(5.71511, -0.18802), 'Pantang, Ga East', 'district', 'specialist', 'public', 'active'),
    ('PML Hospital', 'GHS-GAR-0010', POINT(5.5446, -0.21302), 'Paladium, Accra Metropolitan', 'district', 'district', 'public', 'active'),
    ('Police Hospital', 'GHS-GAR-0011', POINT(5.56835, -0.18145), 'Cantoments, Accra Metropolitan', 'district', 'district', 'quasi_government', 'active'),
    ('Trust Hospital (SSNIT Hospital)', 'GHS-GAR-0012', POINT(5.56244, -0.18174), 'Osu, Accra Metropolitan', 'district', 'district', 'quasi_government', 'active'),
    ('Cocoa Clinic', 'GHS-GAR-0013', POINT(5.57172, -0.2357), 'North Kaneshie, Accra Metropolitan', 'district', 'district', 'quasi_government', 'active'),
    ('Afenyo Memorial Hospital', 'GHS-GAR-0014', POINT(5.69028, -0.03417), 'Ashaiman, Tema Metropolitan', 'district', 'district', 'private', 'active'),
    ('Apenyo Memorial Hospital', 'GHS-GAR-0015', POINT(5.69028, -0.03417), 'Ashaiman, Tema Metropolitan', 'district', 'district', 'private', 'active'),
    ('Al-ayar Clinic & Maternity Home', 'GHS-GAR-0016', POINT(5.61371, -0.24046), 'Akweteman, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Amoah Memorial Hospital', 'GHS-GAR-0017', POINT(5.59055, -0.28732), 'Awoshie, Ga West', 'district', 'district', 'private', 'active'),
    ('Asamoah Clinic', 'GHS-GAR-0018', POINT(5.61148, -0.22208), 'Abelemkpe, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Asare Odei Hospital', 'GHS-GAR-0019', POINT(5.64073, -0.16868), 'East Legon, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Bart-Plange Memorial Clinic', 'GHS-GAR-0020', POINT(5.55005, -0.22199), 'Agbogbloshie, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Bengali Hospital', 'GHS-GAR-0021', POINT(5.6681, -0.02051), 'Tema Community 11, Tema Metropolitan', 'district', 'district', 'private', 'active'),
    ('Bennette Memorial Clinic', 'GHS-GAR-0022', POINT(5.58418, -0.20844), 'New Town, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Biomedical Department', 'GHS-GAR-0023', POINT(5.53599, -0.22959), 'Korle-bu, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Bukom Ellphkwei Hospital', 'GHS-GAR-0024', POINT(5.69263, -0.02201), 'Ashaiman, Tema Metropolitan', 'district', 'district', 'private', 'active'),
    ('Caiquo Hospital', 'GHS-GAR-0025', POINT(5.65332, -0.02255), 'Tema Community 10, Tema Metropolitan', 'district', 'district', 'private', 'active'),
    ('Clecom Memorial Specialist Hospital', 'GHS-GAR-0026', POINT(5.61495, -0.19474), 'Dzorwulu, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Christian Medical Centre', 'GHS-GAR-0027', POINT(5.60656, -0.07769), 'Nungua, Accra Metropolitan', 'district', 'district', 'faith_based', 'active'),
    ('Darben Clinic', 'GHS-GAR-0028', POINT(5.6831, 0.03603), 'Ashaiman, Tema Metropolitan', 'district', 'district', 'private', 'active'),
    ('Deseret Hospital', 'GHS-GAR-0029', POINT(5.60821, -0.27876), 'Antiaku, Ga West', 'district', 'district', 'private', 'active'),
    ('East Legon Clinic', 'GHS-GAR-0030', POINT(5.63002, -0.17534), 'East Legon, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Eden Specialist Hospital', 'GHS-GAR-0031', POINT(5.5803, -0.22805), 'North Kaneshie, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Egon German Clinic', 'GHS-GAR-0032', POINT(5.61261, -0.21417), 'Abelemkpe, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('El-Rapha Clinic', 'GHS-GAR-0033', POINT(5.56096, -0.24662), 'Mataheko, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Eye Gye Nyame Clinic', 'GHS-GAR-0034', POINT(5.57916, -0.20364), 'Nima, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Faith Evangelical Hospital', 'GHS-GAR-0035', POINT(5.57727, -0.23709), 'Bubuashie, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Faith Medical Centre', 'GHS-GAR-0036', POINT(5.59978, -0.21767), 'Alajo, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Family Health Hospital', 'GHS-GAR-0037', POINT(5.54547, -0.22981), 'Korle-bu, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Fire Medical Centre (Old site)', 'GHS-GAR-0038', POINT(5.53282, -0.2177), 'James Town, Accra Metropolitan', 'district', 'district', 'public', 'active'),
    ('Gak Clinic', 'GHS-GAR-0039', POINT(5.55989, -0.174), 'Osu, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Gloria Family Health Centre', 'GHS-GAR-0040', POINT(5.69705, -0.17367), 'Adenta, Tema Metropolitan', 'district', 'district', 'private', 'active'),
    ('Greater Grace Hospital', 'GHS-GAR-0041', POINT(5.71866, -0.17425), 'Pantang, Ga East', 'district', 'district', 'private', 'active'),
    ('Hajj Abdulai Yaro''s Memorial Clinic', 'GHS-GAR-0042', POINT(5.58254, -0.19682), 'Nima, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Harmony Clinic', 'GHS-GAR-0043', POINT(5.67152, -0.17373), 'Madina, Ga East', 'district', 'district', 'private', 'active'),
    ('Holy Trinity Medical Centre', 'GHS-GAR-0044', POINT(5.5867, -0.23519), 'North Kaneshie, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Iran Clinic', 'GHS-GAR-0045', POINT(5.568, -0.21248), 'Circle, Accra Metropolitan', 'district', 'district', 'faith_based', 'active'),
    ('Johpat Hospital', 'GHS-GAR-0046', POINT(5.61151, -0.19963), 'Dzorwulu, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Jubail Specialist Hospital', 'GHS-GAR-0047', POINT(5.62549, -0.05216), 'Sakumano Estate, Tema Metropolitan', 'district', 'district', 'private', 'active'),
    ('Karikari Brobbey Hospital', 'GHS-GAR-0048', POINT(5.53092, -0.26149), 'Agege, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('King David Hospital', 'GHS-GAR-0049', POINT(5.59277, -0.20588), 'Kotobabi, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Kumorji Hospital', 'GHS-GAR-0050', POINT(5.57419, -0.18263), 'Cantoments, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Lakeside Clinic', 'GHS-GAR-0051', POINT(5.5923, -0.23136), 'Tesano, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Lapaz Community Clinic', 'GHS-GAR-0052', POINT(5.60851, -0.25349), 'Abaka Lapas, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Link Road Hospital', 'GHS-GAR-0053', POINT(5.54944, -0.24093), 'Lartebiokorshie, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Mab Medicare Centre', 'GHS-GAR-0054', POINT(5.59958, -0.25417), 'Nyamekye, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Manna Mission Hospital', 'GHS-GAR-0055', POINT(5.60706, -0.10872), 'Teshie, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Martin Memorial Hospital', 'GHS-GAR-0056', POINT(5.61023, -0.20448), 'Dzorwulu, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Medifem Hospital', 'GHS-GAR-0057', POINT(5.61284, -0.20209), 'Dzorwulu, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Megavest Medical Centre', 'GHS-GAR-0058', POINT(5.59342, -0.24423), 'North Kaneshie, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Mercy Clinic', 'GHS-GAR-0059', POINT(5.56431, -0.24764), 'Mataheko, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Midway Clinic Ltd', 'GHS-GAR-0060', POINT(5.61731, -0.22646), 'Abofu, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Modern Atomic Clinic', 'GHS-GAR-0061', POINT(5.66743, -0.20819), 'Atomic Road, Ga East', 'district', 'district', 'private', 'active'),
    ('Motorway Clinic', 'GHS-GAR-0062', POINT(5.60616, -0.25137), 'Abeka Lapas, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Narh Bita Hospital', 'GHS-GAR-0063', POINT(5.65793, -0.01062), 'Tema Community 4, Tema Metropolitan', 'district', 'district', 'private', 'active'),
    ('New Achimota Clinic', 'GHS-GAR-0064', POINT(5.6293, -0.24781), 'New Achimota, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Nightingale Clinic', 'GHS-GAR-0065', POINT(5.55031, -0.26737), 'Dansoman, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('North Legon Hospital', 'GHS-GAR-0066', POINT(5.66923, -0.18228), 'North Legon, Ga East', 'district', 'district', 'private', 'active'),
    ('North Ridge Clinic', 'GHS-GAR-0067', POINT(5.57275, -0.19852), 'North Ridge, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Opoku Ware Clinic', 'GHS-GAR-0068', POINT(5.56451, -0.27354), 'Dansoman, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Port Medical Centre', 'GHS-GAR-0069', POINT(5.64266, 0.00126), 'Tema Community 1, Tema Metropolitan', 'district', 'district', 'private', 'active'),
    ('Provita Specialist Hospital', 'GHS-GAR-0070', POINT(5.65216, -0.0198), 'Tema Community 6, Tema Metropolitan', 'district', 'district', 'private', 'active'),
    ('Queen''s Medical Centre', 'GHS-GAR-0071', POINT(5.57571, -0.20762), 'Kokomlemle, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Sakumono Community Clinic', 'GHS-GAR-0072', POINT(5.62224, -0.06281), 'Sakumano Estate, Tema Metropolitan', 'district', 'district', 'private', 'active'),
    ('Salvation Army Urban Aid Clinic', 'GHS-GAR-0073', POINT(5.5947, -0.19169), 'Maamobi, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Sape Agbo Memorial Hospital', 'GHS-GAR-0074', POINT(5.59232, -0.20804), 'New Town, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('SIC Bob Freeman Clinic', 'GHS-GAR-0075', POINT(5.55408, -0.20889), 'Adabraka, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Specialist Hospital & Family Planning Centre', 'GHS-GAR-0076', POINT(5.56507, -0.27309), 'Dansoman, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('St Anthony''s Clinic', 'GHS-GAR-0077', POINT(5.64954, -0.00299), 'Tema Community 1, Tema Metropolitan', 'district', 'district', 'private', 'active'),
    ('St Mathew''s Clinic', 'GHS-GAR-0078', POINT(5.63286, -0.24057), 'New Achimota, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('St Nicholas Hospital', 'GHS-GAR-0079', POINT(5.64811, -0.01317), 'Tema Community 5, Tema Metropolitan', 'district', 'district', 'private', 'active'),
    ('Sulemana Memorial Hospital Ltd', 'GHS-GAR-0080', POINT(5.59448, -0.19546), 'Maamobi, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Taifa Medical Centre', 'GHS-GAR-0081', POINT(5.6576, -0.25345), 'Taifa, Ga East', 'district', 'district', 'private', 'active'),
    ('Tema Women''s Hospital', 'GHS-GAR-0082', POINT(5.6656, -0.01902), 'Tema Community 10, Tema Metropolitan', 'district', 'district', 'private', 'active'),
    ('The Rock Hospital', 'GHS-GAR-0083', POINT(5.58483, -0.2627), 'Odorkor, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Unicorn Memorial Clinic', 'GHS-GAR-0084', POINT(5.57818, -0.11181), 'Teshie, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Valco Hospital', 'GHS-GAR-0085', POINT(5.66886, 0.03468), 'Tema, Tema Metropolitan', 'district', 'district', 'private', 'active'),
    ('Vicon Specialist Hospital', 'GHS-GAR-0086', POINT(5.5518, -0.26671), 'Dansoman, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Doku Memorial Clinic', 'GHS-GAR-0087', POINT(5.68042, -0.16565), 'Madina, Ga East', 'district', 'district', 'private', 'active'),
    ('Blessings Clinic', 'GHS-GAR-0088', POINT(5.59917, -0.2325), 'Tesano, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Binney Medical Centre', 'GHS-GAR-0089', POINT(5.63344, -0.00936), 'Tema Community 2, Tema Metropolitan', 'district', 'district', 'private', 'active'),
    ('Nyaho Medical Centre', 'GHS-GAR-0090', POINT(5.61486, -0.18514), 'Airport residential area, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Lister Hospital', 'GHS-GAR-0091', POINT(5.61486, -0.18514), 'Airport, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('C & J Medicare', 'GHS-GAR-0092', POINT(5.580728, -0.210467), 'Tudu, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Obenfo Hospital', 'GHS-GAR-0093', POINT(5.580728, -0.210467), 'Mataheko, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Twumasi-Waah Memorial Hospital', 'GHS-GAR-0094', POINT(5.580728, -0.210467), 'East Legon, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Family Health Ltd.', 'GHS-GAR-0095', POINT(5.580728, -0.210467), 'Teshie, Accra Metropolitan', 'district', 'district', 'private', 'active'),
    ('Holy Dove Hospital', 'GHS-GAR-0096', POINT(5.708873, -0.2432307), 'New Achimota, Ga West', 'district', 'district', 'private', 'active'),
    ('Van Medical Centre', 'GHS-GAR-0097', POINT(5.708873, -0.2432307), 'Ashongman, Ga East', 'district', 'district', 'private', 'active'),
    ('Jilac Specialist Hospital', 'GHS-GAR-0098', POINT(5.708873, -0.2432307), 'Dome, Ga East', 'district', 'district', 'private', 'active'),
    ('Dangme East District Hospital', 'GHS-GAR-0099', POINT(5.88888, 0.56949), 'Ada, Dangme East', 'district', 'district', 'public', 'active')
ON CONFLICT (license_number) DO NOTHING;

-- ── Polyclinics ──
INSERT INTO hospitals (name, license_number, gps_coordinates, address, level, type, ownership, status) VALUES
    ('Adabraka Polyclinic', 'GHS-GAR-0100', POINT(5.56129, -0.20477), 'Adabraka, Accra Metropolitan', 'polyclinic', 'polyclinic', 'public', 'active'),
    ('Kaneshie Polyclinic', 'GHS-GAR-0101', POINT(5.57446, -0.23074), 'Kaneshie, Accra Metropolitan', 'polyclinic', 'polyclinic', 'public', 'active'),
    ('Korle-Bu Polyclinic', 'GHS-GAR-0102', POINT(5.580728, -0.210467), 'Korle-Bu, Accra Metropolitan', 'polyclinic', 'polyclinic', 'public', 'active'),
    ('Korle-Gonno Polyclinic', 'GHS-GAR-0103', POINT(5.53736, -0.22312), 'Korle-bu, Ga East', 'polyclinic', 'polyclinic', 'public', 'active'),
    ('Maamobi Polyclinic', 'GHS-GAR-0104', POINT(5.59184, -0.19929), 'Maamobi, Accra Metropolitan', 'polyclinic', 'polyclinic', 'public', 'active'),
    ('Mamprobi Polyclinic', 'GHS-GAR-0105', POINT(5.53807, -0.24556), 'Mamprobi, Accra Metropolitan', 'polyclinic', 'polyclinic', 'public', 'active'),
    ('Tema Polyclinic', 'GHS-GAR-0106', POINT(5.63556, -0.00667), 'Tema Community 2, Tema Metropolitan', 'polyclinic', 'polyclinic', 'public', 'active'),
    ('Ussher Polyclinic', 'GHS-GAR-0107', POINT(5.54038, -0.21294), 'James Town, Accra Metropolitan', 'polyclinic', 'polyclinic', 'public', 'active')
ON CONFLICT (license_number) DO NOTHING;

-- ── Health Centres ──
INSERT INTO hospitals (name, license_number, gps_coordinates, address, level, type, ownership, status) VALUES
    ('Abokobi Health Centre', 'GHS-GAR-0108', POINT(5.7345, -0.20296), 'Abokobi, Ga East', 'health_centre', 'health_centre', 'public', 'active'),
    ('Ada Health Centre', 'GHS-GAR-0109', POINT(5.78477, 0.62719), 'Ada, Dangme East', 'health_centre', 'health_centre', 'private', 'active'),
    ('Alpha Medical centre', 'GHS-GAR-0110', POINT(5.66423, -0.15746), 'Madina, Ga East', 'health_centre', 'health_centre', 'faith_based', 'active'),
    ('Amasaman Health Centre', 'GHS-GAR-0111', POINT(5.70185, -0.29998), 'Amasaman, Ga East', 'health_centre', 'health_centre', 'private', 'active'),
    ('Ashaiman Health Centre', 'GHS-GAR-0112', POINT(5.68576, -0.03945), 'Ashaiman, Tema Metropolitan', 'health_centre', 'health_centre', 'private', 'active'),
    ('Bornikope Health Centre', 'GHS-GAR-0113', POINT(5.84672, 0.40386), 'Bornikope, Dangme East', 'health_centre', 'health_centre', 'public', 'active'),
    ('Danfa Health Centre', 'GHS-GAR-0114', POINT(5.78942, -0.15948), 'Danfa, Ga East', 'health_centre', 'health_centre', 'private', 'active'),
    ('Dodowa Health Centre', 'GHS-GAR-0115', POINT(5.88556, -0.09225), 'Dodowa, Dangme West', 'health_centre', 'health_centre', 'public', 'active'),
    ('Einen Medical Centre', 'GHS-GAR-0116', POINT(5.63344, -0.00946), 'Tema Community 2, Tema Metropolitan', 'health_centre', 'health_centre', 'private', 'active'),
    ('Fralena Health Centre', 'GHS-GAR-0117', POINT(5.5648, -0.23579), 'Kaneshie, Accra Metropolitan', 'health_centre', 'health_centre', 'private', 'active'),
    ('Kasseh Health Centre', 'GHS-GAR-0118', POINT(5.89665, 0.52294), 'Kasseh, Dangme East', 'health_centre', 'health_centre', 'private', 'active'),
    ('Kpone Health Centre', 'GHS-GAR-0119', POINT(5.69206, 0.05842), 'Kpone, Tema Metropolitan', 'health_centre', 'health_centre', 'private', 'active'),
    ('Obom Health Centre', 'GHS-GAR-0120', POINT(5.7357, -0.43974), 'Obom, Ga West', 'health_centre', 'health_centre', 'private', 'active'),
    ('Oduman Health Centre', 'GHS-GAR-0121', POINT(5.64171, -0.33028), 'Oduman, Ga West', 'health_centre', 'health_centre', 'public', 'active'),
    ('Old Ningo Health Centre', 'GHS-GAR-0122', POINT(5.75161, 0.18647), 'Old Ningo, Dangme West', 'health_centre', 'health_centre', 'private', 'active'),
    ('Oyibi Health Centre', 'GHS-GAR-0123', POINT(5.80615, -0.10773), 'Oyibi, Tema Metropolitan', 'health_centre', 'health_centre', 'private', 'active'),
    ('Pediator Kope Health Centre', 'GHS-GAR-0124', POINT(5.82202, 0.62849), 'Pediator Kope, Dangme East', 'health_centre', 'health_centre', 'private', 'active'),
    ('Prampram Health Centre', 'GHS-GAR-0125', POINT(5.71177, 0.11002), 'Prampram, Dangme West', 'health_centre', 'health_centre', 'private', 'active'),
    ('Raphel Medical Centre', 'GHS-GAR-0126', POINT(5.64655, -0.00772), 'Tema, Tema Metropolitan', 'health_centre', 'health_centre', 'private', 'active'),
    ('Sege Health Centre', 'GHS-GAR-0127', POINT(5.87531, 0.36137), 'Sege, Dangme East', 'health_centre', 'health_centre', 'public', 'active'),
    ('Solace Medical Centre', 'GHS-GAR-0128', POINT(5.67782, -0.02954), 'Ashaiman Community 12, Tema Metropolitan', 'health_centre', 'health_centre', 'private', 'active'),
    ('Tema Manhean Health Centre', 'GHS-GAR-0129', POINT(5.64783, 0.02428), 'Tema Manhean, Tema Metropolitan', 'health_centre', 'health_centre', 'private', 'active'),
    ('Dansoman Health Centre', 'GHS-GAR-0130', POINT(5.56125, -0.26), 'Dansoman, Accra Metropolitan', 'health_centre', 'health_centre', 'public', 'active')
ON CONFLICT (license_number) DO NOTHING;

-- ── District Health Centres ──
INSERT INTO hospitals (name, license_number, gps_coordinates, address, level, type, ownership, status) VALUES
    ('Ablekuma Sub Metro Health Directorate', 'GHS-GAR-0131', POINT(5.53851, -0.24517), 'Mamprobi, Accra Metropolitan', 'district', 'district', 'public', 'active'),
    ('Accra Metro Health Directorate', 'GHS-GAR-0132', POINT(5.56223, -0.20376), 'Adabraka, Accra Metropolitan', 'district', 'district', 'public', 'active'),
    ('Ayawaso Sub Metro Health Directorate', 'GHS-GAR-0133', POINT(5.59134, -0.19931), 'Maamobi, Accra Metropolitan', 'district', 'district', 'public', 'active'),
    ('Dangme East District Health Directorate', 'GHS-GAR-0134', POINT(5.78469, 0.62763), 'Ada, Dangme East', 'district', 'district', 'public', 'active'),
    ('Dangme West District Health Directorate', 'GHS-GAR-0135', POINT(5.8855, -0.09255), 'Dodowa, Dangme West', 'district', 'district', 'public', 'active'),
    ('Ga East District Health Directorate', 'GHS-GAR-0136', POINT(5.7345, -0.20296), 'Abokobi, Ga East', 'district', 'district', 'public', 'active'),
    ('Ga West District Health Directorate', 'GHS-GAR-0137', POINT(5.70119, -0.30056), 'Amasaman, Ga West', 'district', 'district', 'public', 'active'),
    ('Kpeshie Sub Metro Health Directorate', 'GHS-GAR-0138', POINT(5.55538, -0.16657), 'La, Accra Metropolitan', 'district', 'district', 'public', 'active'),
    ('Okai Koi Sub Metro Health Directorate', 'GHS-GAR-0139', POINT(5.57442, -0.23082), 'Kaneshie, Accra Metropolitan', 'district', 'district', 'public', 'active'),
    ('Tema Municipal Health Directorate', 'GHS-GAR-0140', POINT(5.63979, -0.00893), 'Tema Community 1, Tema Metropolitan', 'district', 'district', 'public', 'active')
ON CONFLICT (license_number) DO NOTHING;

-- ── Regional Health Centres ──
INSERT INTO hospitals (name, license_number, gps_coordinates, address, level, type, ownership, status) VALUES
    ('Regional Health Directorate', 'GHS-GAR-0141', POINT(5.55802, -0.20629), 'Adabraka, Accra Metropolitan', 'regional', 'regional', 'private', 'active'),
    ('Regional Health Directorate (new site)', 'GHS-GAR-0142', POINT(5.56179, -0.20348), 'Adabraka, Accra Metropolitan', 'regional', 'regional', 'public', 'active')
ON CONFLICT (license_number) DO NOTHING;

-- ── CHPS Compounds ──
INSERT INTO hospitals (name, license_number, gps_coordinates, address, level, type, ownership, status) VALUES
    ('Dome Sampah-mang CHPS', 'GHS-GAR-0143', POINT(5.71916, -0.36576), 'Dome Sampah-mang, Ga West', 'chps', 'chps', 'private', 'active'),
    ('Kokrobite CHPS', 'GHS-GAR-0144', POINT(5.50209, -0.37027), 'Kokrobite, Ga East', 'chps', 'chps', 'private', 'active'),
    ('Nsakina CHPS', 'GHS-GAR-0145', POINT(5.65177, -0.32388), 'Nsakina, Ga West', 'chps', 'chps', 'public', 'active'),
    ('Nyigbenya Clinic', 'GHS-GAR-0146', POINT(5.83471, 0.21885), 'Nugbenya, Dangme West', 'chps', 'chps', 'private', 'active'),
    ('Taifa CHPS', 'GHS-GAR-0147', POINT(5.708873, -0.2432307), 'Taifa, Ga East', 'chps', 'chps', 'private', 'active')
ON CONFLICT (license_number) DO NOTHING;

-- ── Clinics (selected key clinics from CSV) ──
INSERT INTO hospitals (name, license_number, gps_coordinates, address, level, type, ownership, status) VALUES
    ('Arakan Maternity Home', 'GHS-GAR-0148', POINT(5.59714, -0.15088), 'Burma Camp, Accra Metropolitan', 'health_centre', 'health_centre', 'private', 'active'),
    ('Arakan Medical Centre', 'GHS-GAR-0149', POINT(5.59714, -0.15088), 'Burma Camp, Accra Metropolitan', 'health_centre', 'health_centre', 'private', 'active'),
    ('1st Foundation Clinic', 'GHS-GAR-0150', POINT(5.54182, -0.2648), 'Dansoman, Accra Metropolitan', 'health_centre', 'health_centre', 'private', 'active'),
    ('441 Welfare Association Clinic', 'GHS-GAR-0151', POINT(5.58446, -0.19419), 'Nima, Accra Metropolitan', 'health_centre', 'health_centre', 'private', 'active'),
    ('Abodwe Clinic', 'GHS-GAR-0152', POINT(5.53469, -0.24216), 'Mamprobi, Accra Metropolitan', 'health_centre', 'health_centre', 'private', 'active'),
    ('Abora Clinic', 'GHS-GAR-0153', POINT(5.57034, -0.20905), 'Asylum Down, Accra Metropolitan', 'health_centre', 'health_centre', 'private', 'active'),
    ('Airport Clinic Ltd', 'GHS-GAR-0154', POINT(5.60399, -0.1722), 'Airport, Accra Metropolitan', 'health_centre', 'health_centre', 'private', 'active'),
    ('Akai House Clinic', 'GHS-GAR-0155', POINT(5.60219, -0.19218), 'Roman Ridge, Accra Metropolitan', 'health_centre', 'health_centre', 'private', 'active'),
    ('Beach Community Clinic', 'GHS-GAR-0156', POINT(5.53312, -0.21164), 'James Town, Accra Metropolitan', 'health_centre', 'health_centre', 'public', 'active'),
    ('Bank of Ghana Clinic', 'GHS-GAR-0157', POINT(5.56584, -0.19736), 'Ridge, Accra Metropolitan', 'health_centre', 'health_centre', 'public', 'active'),
    ('Ghana Police Clinic', 'GHS-GAR-0158', POINT(5.59374, -0.17854), 'Licencing Office, Accra Metropolitan', 'health_centre', 'health_centre', 'public', 'active'),
    ('GIMPA Clinic', 'GHS-GAR-0159', POINT(5.63633, -0.20028), 'Greenhill, Accra Metropolitan', 'health_centre', 'health_centre', 'public', 'active'),
    ('Ghana Atomic Energy Commission Clinic', 'GHS-GAR-0160', POINT(5.66854, -0.23162), 'Atomic, Ga East', 'health_centre', 'health_centre', 'public', 'active'),
    ('PPAG Clinic', 'GHS-GAR-0161', POINT(5.55042, -0.24156), 'Lartebiokoshie, Accra Metropolitan', 'health_centre', 'health_centre', 'faith_based', 'active'),
    ('Rabito Clinic', 'GHS-GAR-0162', POINT(5.56549, -0.18028), 'Osu, Accra Metropolitan', 'health_centre', 'health_centre', 'private', 'active'),
    ('Kokrobite Community Clinic', 'GHS-GAR-0163', POINT(5.50179, -0.37017), 'Kokrobite, Ga West', 'health_centre', 'health_centre', 'public', 'active'),
    ('Ngleshie Amanfro Community Health Centre', 'GHS-GAR-0164', POINT(5.53638, -0.41126), 'Ngleshie Amamfrom, Ga West', 'health_centre', 'health_centre', 'private', 'active'),
    ('Redeemer''s Mission Clinic', 'GHS-GAR-0165', POINT(5.68863, -0.28584), 'Pokuase, Ga West', 'health_centre', 'health_centre', 'faith_based', 'active'),
    ('Teshie Community Clinic', 'GHS-GAR-0166', POINT(5.57696, -0.10644), 'Teshie, Accra Metropolitan', 'health_centre', 'health_centre', 'public', 'active'),
    ('Nungua Community Clinic', 'GHS-GAR-0167', POINT(5.5974, -0.07896), 'Nungua, Accra Metropolitan', 'health_centre', 'health_centre', 'private', 'active'),
    ('Fahd Al-Marzouq Clinic', 'GHS-GAR-0168', POINT(5.58522, -0.19976), 'Nima, Accra Metropolitan', 'health_centre', 'health_centre', 'faith_based', 'active'),
    ('Opec Clinic (Teshie Health Centre)', 'GHS-GAR-0169', POINT(5.6021, -0.11996), 'Teshie, Accra Metropolitan', 'health_centre', 'health_centre', 'public', 'active'),
    ('Osudoku Health Centre', 'GHS-GAR-0170', POINT(6.07519, 0.19468), 'Asutsuare, Dangme West', 'health_centre', 'health_centre', 'private', 'active'),
    ('St Andrews Catholic Clinic', 'GHS-GAR-0171', POINT(5.92528, 0.01798), 'Kordiabe, Dangme West', 'health_centre', 'health_centre', 'faith_based', 'active'),
    ('Madina Health Centre', 'GHS-GAR-0172', POINT(5.708873, -0.2432307), 'Madina, Ga East', 'health_centre', 'health_centre', 'private', 'active')
ON CONFLICT (license_number) DO NOTHING;


-- =========================================================================
-- 3. USERS
-- =========================================================================

-- Super Admin
INSERT INTO users (email, password_hash, role_id, full_name, auth_provider, status) VALUES (
    'admin@hrs.gov.gh',
    '$2b$12$0P2cmugG2OrVRgj6xtzHJuhIWJOKLkQWzcEp1MROQgvaqIniF5nP6',  -- admin123
    (SELECT role_id FROM role WHERE role_name = 'super_admin'),
    'System Administrator',
    'local',
    'active'
) ON CONFLICT (email) DO NOTHING;

-- Hospital Admin at Korle Bu Teaching Hospital
INSERT INTO users (email, password_hash, role_id, full_name, hospital_id, auth_provider, status) VALUES (
    'admin@korlebu.gov.gh',
    '$2b$12$ltOuP34zFWwoUnmjb3.lruk/9mHECCVCX6g4ykm31RdUAKp7OPzdK',  -- hospital123
    (SELECT role_id FROM role WHERE role_name = 'hospital_admin'),
    'Dr. Ama Korle-Bu Admin',
    (SELECT hospital_id FROM hospitals WHERE name = 'Korle-Bu Teaching Hospital' LIMIT 1),
    'local',
    'active'
) ON CONFLICT (email) DO NOTHING;

-- Hospital Admin at Ridge Hospital
INSERT INTO users (email, password_hash, role_id, full_name, hospital_id, auth_provider, status) VALUES (
    'admin@ridge.gov.gh',
    '$2b$12$ltOuP34zFWwoUnmjb3.lruk/9mHECCVCX6g4ykm31RdUAKp7OPzdK',  -- hospital123
    (SELECT role_id FROM role WHERE role_name = 'hospital_admin'),
    'Ridge Hospital Admin',
    (SELECT hospital_id FROM hospitals WHERE name = 'Ridge Hospital' LIMIT 1),
    'local',
    'active'
) ON CONFLICT (email) DO NOTHING;

-- Hospital Admin at 37 Military Hospital
INSERT INTO users (email, password_hash, role_id, full_name, hospital_id, auth_provider, status) VALUES (
    'admin@37military.gov.gh',
    '$2b$12$ltOuP34zFWwoUnmjb3.lruk/9mHECCVCX6g4ykm31RdUAKp7OPzdK',  -- hospital123
    (SELECT role_id FROM role WHERE role_name = 'hospital_admin'),
    '37 Military Admin',
    (SELECT hospital_id FROM hospitals WHERE name = '37 Military Hospital' LIMIT 1),
    'local',
    'active'
) ON CONFLICT (email) DO NOTHING;

-- Physician at Korle Bu
INSERT INTO users (email, password_hash, role_id, full_name, phone_number, hospital_id, auth_provider, status) VALUES (
    'dr.mensah@korlebu.gov.gh',
    '$2b$12$TgIpTbeKVNVq599bCSWNAOCJjFNq/4kXxcB53EwWv4pE.mDQP2QB.',  -- physician123
    (SELECT role_id FROM role WHERE role_name = 'physician'),
    'Dr. Kwame Mensah',
    '+233 24 123 4567',
    (SELECT hospital_id FROM hospitals WHERE name = 'Korle-Bu Teaching Hospital' LIMIT 1),
    'local',
    'active'
) ON CONFLICT (email) DO NOTHING;

-- Physician at 37 Military
INSERT INTO users (email, password_hash, role_id, full_name, phone_number, hospital_id, auth_provider, status) VALUES (
    'dr.addo@37military.gov.gh',
    '$2b$12$TgIpTbeKVNVq599bCSWNAOCJjFNq/4kXxcB53EwWv4pE.mDQP2QB.',  -- physician123
    (SELECT role_id FROM role WHERE role_name = 'physician'),
    'Dr. Grace Addo',
    '+233 20 987 6543',
    (SELECT hospital_id FROM hospitals WHERE name = '37 Military Hospital' LIMIT 1),
    'local',
    'active'
) ON CONFLICT (email) DO NOTHING;


-- =========================================================================
-- 4. PHYSICIANS
-- =========================================================================
INSERT INTO physicians (user_id, hospital_id, license_number, title, specialization, department, grade, status) VALUES
    (
        (SELECT user_id FROM users WHERE email = 'dr.mensah@korlebu.gov.gh'),
        (SELECT hospital_id FROM hospitals WHERE name = 'Korle-Bu Teaching Hospital' LIMIT 1),
        'MC-GH-12345',
        'Dr',
        'General Practice',
        'Accidents & Emergency',
        'Senior Medical Officer',
        'active'
    ),
    (
        (SELECT user_id FROM users WHERE email = 'dr.addo@37military.gov.gh'),
        (SELECT hospital_id FROM hospitals WHERE name = '37 Military Hospital' LIMIT 1),
        'MC-GH-67890',
        'Dr',
        'Surgery',
        'Surgery',
        'Medical Officer',
        'active'
    )
ON CONFLICT (user_id) DO NOTHING;


-- =========================================================================
-- 5. SAMPLE PATIENTS
-- =========================================================================
INSERT INTO patients (physician_id, hospital_id, patient_identifier, full_name, date_of_birth, sex, nhis_number, nhis_status, contact_number, address, next_of_kin_name, next_of_kin_contact) VALUES
    (
        (SELECT physician_id FROM physicians WHERE license_number = 'MC-GH-12345'),
        (SELECT hospital_id FROM hospitals WHERE name = 'Korle-Bu Teaching Hospital' LIMIT 1),
        'PAT-2026-001',
        'Kwesi Mensah',
        '1985-03-15',
        'male',
        'NHIS-10023456',
        'Active',
        '+233 24 555 1001',
        '14 Oxford Street, Osu, Accra',
        'Ama Mensah',
        '+233 24 555 1002'
    ),
    (
        (SELECT physician_id FROM physicians WHERE license_number = 'MC-GH-12345'),
        (SELECT hospital_id FROM hospitals WHERE name = 'Korle-Bu Teaching Hospital' LIMIT 1),
        'PAT-2026-002',
        'Abena Owusu',
        '1992-07-22',
        'female',
        'NHIS-10034567',
        'Active',
        '+233 20 555 2001',
        '7 Ring Road East, Accra',
        'Kofi Owusu',
        '+233 20 555 2002'
    ),
    (
        (SELECT physician_id FROM physicians WHERE license_number = 'MC-GH-12345'),
        (SELECT hospital_id FROM hospitals WHERE name = 'Korle-Bu Teaching Hospital' LIMIT 1),
        'PAT-2026-003',
        'Yaw Boateng',
        '1970-11-03',
        'male',
        NULL,
        'None',
        '+233 27 555 3001',
        '22 Cantonments Road, Accra',
        'Efua Boateng',
        '+233 27 555 3002'
    )
ON CONFLICT (patient_identifier) DO NOTHING;


-- =========================================================================
-- 6. SAMPLE REFERRAL
-- =========================================================================
INSERT INTO referrals (patient_id, referring_physician_id, referring_hospital_id, receiving_hospital_id, status, severity, stability, emergency_type) VALUES (
    (SELECT patient_id FROM patients WHERE patient_identifier = 'PAT-2026-001'),
    (SELECT physician_id FROM physicians WHERE license_number = 'MC-GH-12345'),
    (SELECT hospital_id FROM hospitals WHERE name = 'Korle-Bu Teaching Hospital' LIMIT 1),
    (SELECT hospital_id FROM hospitals WHERE name = '37 Military Hospital' LIMIT 1),
    'pending',
    'high',
    'stable',
    'cardiac'
) ON CONFLICT DO NOTHING;

INSERT INTO referral_details (referral_id, presenting_complaint, clinical_history, initial_diagnosis, current_condition, reason_for_referral, treatment_given) VALUES (
    (SELECT referral_id FROM referrals ORDER BY referral_id DESC LIMIT 1),
    'Chest pain radiating to left arm, onset 2 hours ago',
    'No previous cardiac history. HTN controlled with medication for 5 years.',
    'Acute Coronary Syndrome',
    'Vitals stable. BP 140/90, HR 88, O2 Sat 96%',
    'Requires specialist cardiac evaluation and possible catheterization',
    'Aspirin 300mg, Sublingual GTN, IV access established'
);


-- =========================================================================
-- 7. NOTIFICATIONS
-- =========================================================================
INSERT INTO notifications (user_id, message, type, is_read, email_sent, read_at) VALUES
    ((SELECT user_id FROM users WHERE email = 'admin@hrs.gov.gh'), 'System initialized successfully.', 'hospital_approval', true, false, NOW()),
    ((SELECT user_id FROM users WHERE email = 'admin@korlebu.gov.gh'), 'New referral received for patient Kwesi Mensah.', 'referral_created', false, false, NULL),
    ((SELECT user_id FROM users WHERE email = 'dr.mensah@korlebu.gov.gh'), 'Your referral for Kwesi Mensah has been submitted.', 'referral_created', true, false, NOW());


-- ==========================================================================
-- Done!
-- ==========================================================================
-- Login Credentials:
--   Super Admin:        admin@hrs.gov.gh / admin123
--   Hospital Admin KB:  admin@korlebu.gov.gh / hospital123
--   Hospital Admin 37:  admin@37military.gov.gh / hospital123
--   Hospital Admin RH:  admin@ridge.gov.gh / hospital123
--   Physician KB:       dr.mensah@korlebu.gov.gh / physician123
--   Physician 37:       dr.addo@37military.gov.gh / physician123
-- ==========================================================================
